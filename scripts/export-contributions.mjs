#!/usr/bin/env node
/**
 * export-contributions — deterministic community-corpus export (Slice 1, Step 5).
 *
 * Reads APPROVED open-commons contributions from the Craft-Codex Supabase
 * (service role, REST) and writes them as a static, byte-stable JSON corpus:
 *
 *   apps/tischler/lib/rag/corpus/community/community-corpus.de.json
 *   apps/tischler/lib/rag/corpus/community/manifest.json
 *
 * Usage:
 *   node scripts/export-contributions.mjs [--dry-run] [--no-pr] [--keychain]
 *                                         [--base <branch>]
 *   node scripts/export-contributions.mjs --mark-published <commit-sha> [--keychain]
 *
 * Flags:
 *   --dry-run          show the diff, write nothing, no slug PATCH, no PR
 *   --no-pr            write the files, but skip branch/commit/push/PR
 *   --keychain         if CRAFT_SUPABASE_SERVICE_ROLE_KEY is not in the env,
 *                      read it from the macOS keychain
 *                      (cm-secret-cockpit.CRAFT_SUPABASE_SERVICE_ROLE_KEY)
 *   --base <branch>    PR base branch (default: repo default branch)
 *   --mark-published   after the export PR is MERGED: transition all manifest
 *                      contributions approved->published (craft_transition RPC)
 *                      and stamp git_commit/published_at. Idempotent.
 *
 * Guarantees:
 *   - HARDCODED REST filter status=approved & visibility=open_commons &
 *     license_accepted=true, PLUS a client-side guard on every returned row
 *     (incl. approved_revision === revision). Any violating row -> hard error
 *     with its id, never a silent skip (double-stitched with the DB filter).
 *   - published_slug: NULL -> derived deterministically and PATCHed back once
 *     (stable forever); already set -> used verbatim, never re-derived.
 *   - Output is byte-identical on re-run over unchanged data (sorted by id,
 *     fixed key order, no timestamps). See scripts/lib/export-core.mjs.
 *   - No author_email anywhere in the export (not even SELECTed).
 *
 * Secrets: the service-role key is never logged and never written to disk.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertRowExportable,
  buildCorpus,
  buildManifest,
  derivePublishedSlug,
  serializeCorpus,
  serializeManifest,
} from "./lib/export-core.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CORPUS_PATH = join(
  REPO_ROOT,
  "apps/tischler/lib/rag/corpus/community/community-corpus.de.json",
);
const MANIFEST_PATH = join(
  REPO_ROOT,
  "apps/tischler/lib/rag/corpus/community/manifest.json",
);
const DEFAULT_SUPABASE_URL = "https://sqxkqdkxwymvznbariyx.supabase.co";
const KEYCHAIN_SERVICE = "cm-secret-cockpit.CRAFT_SUPABASE_SERVICE_ROLE_KEY";

// Deliberately NO author_email / author_id in the SELECT (privacy; S2 opt-in).
const SELECT_COLUMNS =
  "id,status,trade,locale,visibility,revision,content,license_type," +
  "license_accepted,terms_version,approved_revision,published_slug," +
  "git_commit,published_at,created_at";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = {
    dryRun: false,
    noPr: false,
    keychain: false,
    base: null,
    markPublished: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--no-pr") args.noPr = true;
    else if (a === "--keychain") args.keychain = true;
    else if (a === "--base") args.base = argv[++i];
    else if (a === "--mark-published") args.markPublished = argv[++i];
    else {
      console.error(`unknown argument: ${a}`);
      process.exit(2);
    }
  }
  if (args.markPublished !== null && !/^[0-9a-f]{7,40}$/i.test(args.markPublished)) {
    console.error("--mark-published requires a git commit sha");
    process.exit(2);
  }
  return args;
}

// ---------------------------------------------------------------------------
// Config (env first; keychain fallback only with --keychain)
// ---------------------------------------------------------------------------
function getConfig({ keychain }) {
  const url =
    process.env.CRAFT_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_CRAFT_SUPABASE_URL ??
    DEFAULT_SUPABASE_URL;
  let key = process.env.CRAFT_SUPABASE_SERVICE_ROLE_KEY ?? null;
  if (!key && keychain) {
    try {
      key = execFileSync(
        "security",
        ["find-generic-password", "-s", KEYCHAIN_SERVICE, "-w"],
        { encoding: "utf8" },
      ).trim();
    } catch {
      key = null;
    }
  }
  if (!key) {
    console.error(
      "Missing CRAFT_SUPABASE_SERVICE_ROLE_KEY (env; or keychain via --keychain).",
    );
    process.exit(2);
  }
  return { url: url.replace(/\/+$/, ""), key };
}

async function supabaseFetch(cfg, path, init = {}) {
  const res = await fetch(`${cfg.url}${path}`, {
    ...init,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.text();
  if (!res.ok) {
    // body may contain PostgREST error details but never the key.
    throw new Error(`${init.method ?? "GET"} ${path} -> HTTP ${res.status}: ${body}`);
  }
  return body ? JSON.parse(body) : null;
}

// ---------------------------------------------------------------------------
// git helpers — every step re-verifies the current branch (shared checkout!)
// ---------------------------------------------------------------------------
function git(args, opts = {}) {
  return execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    ...opts,
  }).trim();
}

function currentBranch() {
  const b = git(["branch", "--show-current"]);
  if (!b) throw new Error("detached HEAD — refusing to run git steps");
  return b;
}

function assertOnBranch(expected) {
  const b = currentBranch();
  if (b !== expected) {
    throw new Error(`expected to be on branch ${expected}, but on ${b} — aborting`);
  }
}

// ---------------------------------------------------------------------------
// Export flow
// ---------------------------------------------------------------------------
async function fetchApprovedRows(cfg) {
  // HARDCODED filter — do not parameterize (leak guard, see header).
  const path =
    "/rest/v1/craft_contributions" +
    "?status=eq.approved&visibility=eq.open_commons&license_accepted=eq.true" +
    `&select=${SELECT_COLUMNS}&order=created_at.asc`;
  const rows = await supabaseFetch(cfg, path);
  // Client-side guard, double-stitched with the REST filter. Any violation
  // (incl. approved_revision !== revision) is a hard error with the row id.
  for (const row of rows) assertRowExportable(row);
  return rows;
}

async function persistDerivedSlug(cfg, row, slug) {
  await supabaseFetch(
    cfg,
    `/rest/v1/craft_contributions?id=eq.${row.id}&published_slug=is.null`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ published_slug: slug }),
    },
  );
  // Read back: the conditional PATCH may have been a no-op if a concurrent
  // writer fixed the slug first — the DB value always wins.
  const [fresh] = await supabaseFetch(
    cfg,
    `/rest/v1/craft_contributions?id=eq.${row.id}&select=published_slug`,
  );
  if (!fresh?.published_slug) {
    throw new Error(`contribution ${row.id}: failed to persist published_slug`);
  }
  return fresh.published_slug;
}

function showDiff(nextCorpus, nextManifest) {
  const tmp = mkdtempSync(join(tmpdir(), "craft-export-"));
  try {
    const nextDir = join(tmp, "next");
    mkdirSync(nextDir, { recursive: true });
    writeFileSync(join(nextDir, "community-corpus.de.json"), nextCorpus);
    writeFileSync(join(nextDir, "manifest.json"), nextManifest);
    for (const [current, name] of [
      [CORPUS_PATH, "community-corpus.de.json"],
      [MANIFEST_PATH, "manifest.json"],
    ]) {
      const currentPath = existsSync(current) ? current : "/dev/null";
      const res = execFileSync(
        "git",
        ["diff", "--no-index", "--", currentPath, join(nextDir, name)],
        { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      ).trim();
      if (res) console.log(res);
    }
  } catch (err) {
    // git diff --no-index exits 1 when files differ — that IS the diff.
    if (err.stdout) console.log(err.stdout.toString().trim());
    else throw err;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

async function runExport(args) {
  const cfg = getConfig(args);
  const rows = await fetchApprovedRows(cfg);
  console.log(`approved exportable contributions: ${rows.length}`);

  // Fix published_slug for rows that do not have one yet (deterministic,
  // persisted once, stable forever). Dry-run derives but does not persist.
  for (const row of rows) {
    if (!row.published_slug) {
      const slug = derivePublishedSlug(row);
      if (args.dryRun) {
        console.log(`[dry-run] would persist published_slug ${slug} for ${row.id}`);
        row.published_slug = slug;
      } else {
        row.published_slug = await persistDerivedSlug(cfg, row, slug);
        console.log(`persisted published_slug ${row.published_slug} for ${row.id}`);
      }
    }
  }

  const docs = buildCorpus(rows);
  const nextCorpus = serializeCorpus(docs);
  const nextManifest = serializeManifest(buildManifest(docs, nextCorpus));

  const unchanged =
    readIfExists(CORPUS_PATH) === nextCorpus &&
    readIfExists(MANIFEST_PATH) === nextManifest;

  if (args.dryRun) {
    if (unchanged) console.log("[dry-run] no changes — corpus already up to date");
    else showDiff(nextCorpus, nextManifest);
    console.log("[dry-run] nothing written, no PR");
    return;
  }

  if (unchanged) {
    console.log("nothing to export — corpus already up to date (no branch, no PR)");
    return;
  }

  mkdirSync(dirname(CORPUS_PATH), { recursive: true });
  writeFileSync(CORPUS_PATH, nextCorpus);
  writeFileSync(MANIFEST_PATH, nextManifest);
  console.log(`wrote ${CORPUS_PATH}`);
  console.log(`wrote ${MANIFEST_PATH}`);

  if (args.noPr) {
    console.log("--no-pr: skipping branch/commit/push/PR");
    return;
  }

  const startBranch = currentBranch();
  const now = new Date();
  const stamp =
    `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}` +
    `${String(now.getDate()).padStart(2, "0")}-` +
    `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const branch = `community/export-${stamp}`;
  const dateHuman = now.toISOString().slice(0, 10);
  const title = `content(community): export approved contributions ${dateHuman}`;

  try {
    git(["checkout", "-b", branch]);
    assertOnBranch(branch);
    git(["add", "--", CORPUS_PATH, MANIFEST_PATH]);
    assertOnBranch(branch);
    git([
      "commit",
      "-m",
      `${title}\n\nContributions: ${docs
        .map((d) => d.metadata.contribution_id)
        .join(", ")}\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>`,
    ]);
    assertOnBranch(branch);
    git(["push", "-u", "origin", branch]);
    assertOnBranch(branch);
    const prBody =
      `Deterministic export of ${docs.length} approved open-commons ` +
      `contribution(s) into the community corpus.\n\n` +
      `| published_slug | contribution_id |\n|---|---|\n` +
      docs
        .map((d) => `| \`${d.id}\` | \`${d.metadata.contribution_id}\` |`)
        .join("\n") +
      `\n\nLicense: CC-BY-SA-4.0 · Source of truth: craft_contributions ` +
      `(status=approved, visibility=open_commons, license_accepted=true, ` +
      `approved_revision=revision).\n\nAfter merge run:\n` +
      "```\nnode scripts/export-contributions.mjs --mark-published <merge-commit-sha>\n```" +
      `\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)`;
    const prArgs = ["pr", "create", "--title", title, "--body", prBody];
    if (args.base) prArgs.push("--base", args.base);
    const prUrl = execFileSync("gh", prArgs, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
    console.log(`PR created: ${prUrl}`);
  } finally {
    // Always return to the starting branch (shared checkout discipline).
    const here = git(["branch", "--show-current"]);
    if (here !== startBranch) git(["checkout", startBranch]);
  }
}

// ---------------------------------------------------------------------------
// mark-published (run AFTER the export PR is merged)
// ---------------------------------------------------------------------------
async function runMarkPublished(args) {
  const cfg = getConfig(args);
  const manifestRaw = readIfExists(MANIFEST_PATH);
  if (!manifestRaw) {
    console.error(`manifest not found at ${MANIFEST_PATH}`);
    process.exit(2);
  }
  const manifest = JSON.parse(manifestRaw);
  const sha = args.markPublished;
  let published = 0;
  let skipped = 0;
  for (const id of manifest.contribution_ids) {
    const [row] = await supabaseFetch(
      cfg,
      `/rest/v1/craft_contributions?id=eq.${id}&select=id,status,git_commit`,
    );
    if (!row) throw new Error(`contribution ${id} from manifest not found in DB`);
    if (row.status === "published") {
      if (!row.git_commit) {
        // repair path: published but commit missing (previous partial run)
        await supabaseFetch(cfg, `/rest/v1/craft_contributions?id=eq.${id}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ git_commit: sha }),
        });
        console.log(`repaired git_commit for already-published ${id}`);
      } else {
        console.log(`skip ${id} — already published (${row.git_commit.slice(0, 8)})`);
      }
      skipped++;
      continue;
    }
    if (row.status !== "approved") {
      throw new Error(`contribution ${id}: expected approved/published, got ${row.status}`);
    }
    // Stamp provenance FIRST (idempotent), then flip the status through the
    // state machine. If the RPC fails, a re-run repeats both safely.
    await supabaseFetch(cfg, `/rest/v1/craft_contributions?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        git_commit: sha,
        published_at: new Date().toISOString(),
      }),
    });
    await supabaseFetch(cfg, "/rest/v1/rpc/craft_transition", {
      method: "POST",
      body: JSON.stringify({
        p_id: id,
        p_from: "approved",
        p_to: "published",
        p_actor: "export-script",
        p_reason: `published in git commit ${sha}`,
      }),
    });
    console.log(`published ${id} (commit ${sha.slice(0, 8)})`);
    published++;
  }
  console.log(`mark-published done: ${published} published, ${skipped} skipped`);
}

// ---------------------------------------------------------------------------
const args = parseArgs(process.argv);
const run = args.markPublished ? runMarkPublished : runExport;
run(args).catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
