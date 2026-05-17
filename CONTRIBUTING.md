# Contributing to Craft Codex

Thanks for considering a contribution. This guide covers the practical conventions; the rationale is in [README.md](./README.md) and [docs/PHASE-PLAN.md](./docs/PHASE-PLAN.md).

## Quick start

```bash
git clone git@github.com:Bernhard-Reiter/craft-codex.git
cd craft-codex
pnpm install
pnpm dev          # → http://localhost:3100 (Tischler app)
pnpm test         # all packages
pnpm typecheck    # tsc --noEmit across workspace
pnpm boundary-check  # enforces open-core boundary
```

Node ≥ 20, pnpm ≥ 9 required.

## Architecture rules (the open-core boundary)

The engine (`packages/core/`) is the contract. It must remain:

- **Framework-agnostic** — no `next`, `react`, `vue`, `svelte` imports
- **DB-free** — no `@supabase/*`, `@firebase/*`, no SQL clients
- **Auth-free** — no `@auth0/*`, `@clerk/*`, no JWT libraries
- **Transport-free** — no `livekit-*`, no `daily-co`, no WebRTC libs

These are enforced by:

1. `packages/core/scripts/boundary-check.sh` — runs in CI
2. `packages/core/.eslintrc.json` — `no-restricted-imports` rule

If you need a database, auth provider, or live-call transport, wire it in the **consumer app** (`apps/<gewerk>/lib/...`), not in the engine.

## Adding a new trade (Gewerk)

Trades are first-class. Each ships as its own Next.js app sharing `@craft-codex/core`.

```bash
# 1. Copy the Tischler app as a template
cp -r apps/tischler apps/maurer

# 2. Update package.json
#    "name": "@craft-codex/maurer"
#    "description": "Mason tutor app — ..."

# 3. Update the dev port (avoid collision with other trades)
#    package.json: "dev": "next dev -p 3101"

# 4. Update layout.tsx + page.tsx for the new trade
#    title: "Maurer · Craft Codex"

# 5. Build trade-specific lib/ and components/ as needed
#    Generic things (RAG, voice, surface modes) stay shared via @craft-codex/core
```

Port map for parallel dev: see [README.md "Dev port map"](./README.md#dev-port-map).

## Adding a new workpiece within a trade

Workpieces are routes inside a trade app.

```bash
# Inside apps/tischler/app/
mkdir fingerzinken
touch fingerzinken/page.tsx
# Use the existing /dovetail page as a template
```

Each workpiece typically needs:

- A page (`app/<workpiece>/page.tsx`) — 2D / browser view
- An XR variant (`app/<workpiece>/xr/page.tsx`) if applicable
- Procedural geometry helpers — add to `packages/core/src/geometry/` if the math is shared, or co-locate in the app's `lib/geometry/` if trade-specific
- RAG corpus entries — extend `apps/<gewerk>/lib/rag/corpus/<workpiece>-corpus.ts`

## Code conventions

- **TypeScript strict mode** — no `any` outside explicit boundaries
- **No `dangerouslySetInnerHTML`** — DOM-only, never user-controlled
- **Browser-only modules** guard against SSR with `typeof window !== "undefined"`
- **Real provider calls** must accept a `fetchImpl` parameter for testability
- **Tests** use vitest `environment: "node"` by default. For browser-API tests, polyfill in the test file instead of switching environments — keeps the test runner fast.

### Open-core paths

Imports from outside the engine go through the public `package.json` exports of `@craft-codex/core`:

```typescript
// ✅ Good
import { generateBoardAMesh } from "@craft-codex/core";

// ❌ Don't reach into internal paths
import { foo } from "@craft-codex/core/dist/internal/bar.js";
```

We don't ship `internal/` modules yet; if you find yourself needing one, raise an issue first so we can decide the right boundary.

## Tests required for any PR

- New provider classes: at least one test for each public method, plus error-path coverage
- New corpus docs: shape test (license + attribution fields present)
- New trade app: smoke test that the build produces all listed routes (200 / not 500)
- Bug fixes: a regression test that fails before the fix and passes after

Aim for keeping the boundary-check + lint + test + build CI green on every PR.

## PR process

1. Branch from `main`: `feat/<scope>` or `fix/<scope>` or `docs/<scope>`
2. Commit messages: concise subject, full body explaining the *why*. Conventional Commits welcome but not required.
3. Open the PR. CI runs typecheck / test / lint / boundary-check / build / api-key-guard. All must pass.
4. The api-key-guard step blocks any `NEXT_PUBLIC_(ANTHROPIC|OPENAI|ELEVENLABS|GROQ)*_API_KEY` env var name from appearing in the repo — those would inline keys into the browser bundle.
5. One approving review from a maintainer, then squash-merge.

## Reporting

If your PR is more than a one-line change, the PR body should include:

- **What works** — concrete, verified results
- **What does NOT work** — limitations or known gaps (don't leave this empty if there are real ones)
- **What is uncertain** — assumptions, edge cases, areas to double-check
- **Test plan** — what you ran locally and what CI will run

This convention catches more bugs at review time than any tooling.

## License

By contributing, you agree your contributions are licensed under the MIT License (see [LICENSE](./LICENSE)).

## Security

If you find a security issue, **don't open a public issue.** Email the maintainer directly. We aim to acknowledge within 3 days and have a fix or disclosure plan within 14.

In-scope concerns:
- Path-traversal / SSRF in the TTS cache or media-loading paths
- XSS via user-input rendering (currently no user input in MVP — but stay watchful)
- API-key leaks via bundle inlining
- License-incompatible dependencies pulled in transitively

Out-of-scope:
- Issues only reproducible against deployments outside the canonical Vercel preview
- Social-engineering attacks against contributors

## Code of conduct

Be kind. Be specific. Be honest about what your code does and doesn't do. The pedagogical spirit of this project — masters guide apprentices without pretending — applies to the codebase too: no marketing in the README, no aspirational test names, no "should work" comments.
