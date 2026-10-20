import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { erzeugeCookieWert, torKonfig, TOR_COOKIE } from "./tor";
import { torOffen } from "./tor-server";

/**
 * Werkbank S2b: das Probelauf-Tor auf der Server-Seite (torOffen) und der Wächter, der die Regel aus
 * tor-server.ts durchsetzt: jeder Werkbank-Einstieg beginnt mit `if (!(await torOffen())) return|throw …`.
 * Der Wächter liest den Quelltext mit der TypeScript-API (Syntaxbaum, keine Textsuche nach Bedeutung).
 */

vi.mock("server-only", () => ({}));
const krug = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (krug.has(name) ? { name, value: krug.get(name) } : undefined),
  }),
}));

const CODE = "c0dec0dec0dec0dec0dec0dec0dec0de";
const SALZ = "5a175a175a175a175a175a175a175a175a175a175a175a175a175a175a175a17";
const NAMEN = ["ZINKEN_MEISTER_CODE", "ZINKEN_MEISTER_SALZ", "DEBUG", "NODE_DEBUG", "ANTHROPIC_LOG"] as const;
const APP = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

let gesichert: Record<string, string | undefined> = {};

beforeEach(() => {
  gesichert = Object.fromEntries(NAMEN.map((name) => [name, process.env[name]]));
  for (const name of NAMEN) delete process.env[name];
  process.env.ZINKEN_MEISTER_CODE = CODE;
  process.env.ZINKEN_MEISTER_SALZ = SALZ;
  krug.clear();
});

afterEach(() => {
  for (const name of NAMEN) {
    const wert = gesichert[name];
    if (wert === undefined) delete process.env[name];
    else process.env[name] = wert;
  }
});

// ---------------------------------------------------------------- Wächter

const WURZELN = ["app", "lib", "components"];
/** Datei-"use server" außerhalb der Werkbank. NUR echte Nicht-Werkbank-Actions eintragen, sonst fail-open. */
const NICHT_WERKBANK_ACTIONS = ["app/[locale]/beitragen/actions.ts", "app/admin/contributions/actions.ts"];
const EINSTIEG_DATEIEN = new Set(["page", "layout", "template", "default", "route"]);
/** Next-Sonderdateien, Stand Next 15.5 (Bild-Sonderdateien auch mit einer Ziffer, z. B. icon1). */
const SONDERDATEI = /^(?:(?:opengraph-image|twitter-image|icon|apple-icon)\d?|sitemap|robots|manifest)$/;
const CONFIG_EXPORTE = new Set([
  "metadata",
  "viewport",
  "dynamic",
  "dynamicParams",
  "revalidate",
  "fetchCache",
  "runtime",
  "preferredRegion",
  "maxDuration",
]);
const METHODEN = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
const TOR_MODUL = "lib/zinken/werkbank/tor-server";

const G_ERST = "erste Anweisung ist nicht if (!(await torOffen())) return|throw";
const G_IMPORT = "torOffen nicht aus tor-server importiert";
const G_EXPORT = "Export nicht prüfbar";
const G_ERLAUBT = "Export in Werkbank-Datei nicht erlaubt";
const G_SONDER = "Sonderdatei unter der Werkbank";

type Fn = ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration;
interface Export {
  name: string;
  ziel: Fn | null;
  wert?: ts.Expression;
}
interface Ergebnis {
  einstiege: number;
  useServer: string[];
  verstoesse: string[];
}

function sammle(wurzel: string): string[] {
  const dateien: string[] = [];
  const laufe = (ordner: string): void => {
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      const pfad = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) {
        if (eintrag.name !== "node_modules" && eintrag.name !== ".next") laufe(pfad);
      } else if (/\.(tsx?|jsx?|mjs)$/.test(eintrag.name) && !/\.test\.[tj]sx?$/.test(eintrag.name)) {
        dateien.push(relative(wurzel, pfad).split("\\").join("/"));
      }
    }
  };
  for (const w of WURZELN) if (existsSync(join(wurzel, w))) laufe(join(wurzel, w));
  return dateien.sort();
}

/** Ordnerpfad ohne Route-Gruppen, @slots und Intercept-Präfixe, klein geschrieben. */
function normalisiere(rel: string): string {
  const teile: string[] = [];
  for (const roh of rel.toLowerCase().split("/")) {
    const teil = roh.replace(/^(\(\.{1,3}\))+/, "");
    if (teil === "" || /^\(.*\)$/.test(teil) || teil.startsWith("@")) continue;
    teile.push(teil);
  }
  return teile.join("/");
}

function werkbankArt(rel: string): "einstieg" | "sonder" | null {
  const norm = normalisiere(rel);
  if (!norm.startsWith("app/") || !/(^|\/)zinken\/werkbank\//.test(norm)) return null;
  const name = (norm.split("/").pop() ?? "").replace(/\.[^.]+$/, "");
  if (EINSTIEG_DATEIEN.has(name)) return "einstieg";
  if (SONDERDATEI.test(name)) return "sonder";
  return null;
}

function hatUseServer(anweisungen: readonly ts.Statement[]): boolean {
  for (const a of anweisungen) {
    if (!ts.isExpressionStatement(a) || !ts.isStringLiteral(a.expression)) return false;
    if (a.expression.text === "use server") return true;
  }
  return false;
}

function ohneVorrede(anweisungen: readonly ts.Statement[]): ts.Statement[] {
  let i = 0;
  while (i < anweisungen.length) {
    const a = anweisungen[i];
    if (!a || !ts.isExpressionStatement(a) || !ts.isStringLiteral(a.expression)) break;
    i += 1;
  }
  return anweisungen.slice(i);
}

function istFn(knoten: ts.Node | undefined): knoten is Fn {
  return (
    !!knoten &&
    (ts.isFunctionDeclaration(knoten) ||
      ts.isFunctionExpression(knoten) ||
      ts.isArrowFunction(knoten) ||
      ts.isMethodDeclaration(knoten))
  );
}

/** Nur `const` bindet fest; let/var können neu zugewiesen werden und sind deshalb nicht prüfbar. */
function istConst(liste: ts.VariableDeclarationList): boolean {
  return (liste.flags & ts.NodeFlags.BlockScoped) === ts.NodeFlags.Const;
}

function hatModifier(knoten: ts.Node, art: ts.SyntaxKind): boolean {
  return ts.canHaveModifiers(knoten) && (ts.getModifiers(knoten) ?? []).some((m) => m.kind === art);
}

function istLiteral(wert: ts.Expression | undefined): boolean {
  if (!wert) return false;
  if (ts.isAsExpression(wert) || ts.isSatisfiesExpression(wert) || ts.isParenthesizedExpression(wert)) {
    return istLiteral(wert.expression);
  }
  return (
    ts.isObjectLiteralExpression(wert) ||
    ts.isArrayLiteralExpression(wert) ||
    ts.isStringLiteral(wert) ||
    ts.isNoSubstitutionTemplateLiteral(wert) ||
    ts.isNumericLiteral(wert) ||
    wert.kind === ts.SyntaxKind.TrueKeyword ||
    wert.kind === ts.SyntaxKind.FalseKeyword
  );
}

/** Alle Exporte der Datei, lokale Namen auf die Funktion derselben Datei zurückgeführt. */
function exporte(datei: ts.SourceFile): Export[] {
  const lokal = new Map<string, { ziel: Fn | null; wert?: ts.Expression }>();
  for (const a of datei.statements) {
    if (ts.isFunctionDeclaration(a) && a.name) lokal.set(a.name.text, { ziel: a });
    if (ts.isVariableStatement(a)) {
      const fest = istConst(a.declarationList);
      for (const d of a.declarationList.declarations) {
        if (!ts.isIdentifier(d.name)) continue;
        lokal.set(d.name.text, fest ? { ziel: istFn(d.initializer) ? d.initializer : null, wert: d.initializer } : { ziel: null });
      }
    }
  }
  const aufloesen = (name: string, lokalName: string): Export => ({ name, ziel: null, ...lokal.get(lokalName) });
  const liste: Export[] = [];
  for (const a of datei.statements) {
    if (ts.isFunctionDeclaration(a) && hatModifier(a, ts.SyntaxKind.ExportKeyword)) {
      const name = hatModifier(a, ts.SyntaxKind.DefaultKeyword) ? "default" : (a.name?.text ?? "default");
      liste.push({ name, ziel: a });
    } else if (ts.isVariableStatement(a) && hatModifier(a, ts.SyntaxKind.ExportKeyword)) {
      const fest = istConst(a.declarationList);
      for (const d of a.declarationList.declarations) {
        const name = ts.isIdentifier(d.name) ? d.name.text : "<muster>";
        if (fest) liste.push({ name, ziel: istFn(d.initializer) ? d.initializer : null, wert: d.initializer });
        else liste.push({ name, ziel: null });
      }
    } else if (ts.isClassDeclaration(a) && hatModifier(a, ts.SyntaxKind.ExportKeyword)) {
      const name = hatModifier(a, ts.SyntaxKind.DefaultKeyword) ? "default" : (a.name?.text ?? "default");
      liste.push({ name, ziel: null });
    } else if (ts.isExportAssignment(a)) {
      const wert = a.expression;
      if (ts.isIdentifier(wert)) liste.push(aufloesen("default", wert.text));
      else liste.push({ name: "default", ziel: istFn(wert) ? wert : null, wert });
    } else if (ts.isExportDeclaration(a) && !a.isTypeOnly) {
      if (!a.exportClause) liste.push({ name: "*", ziel: null });
      else if (ts.isNamespaceExport(a.exportClause)) liste.push({ name: a.exportClause.name.text, ziel: null });
      else {
        for (const el of a.exportClause.elements) {
          if (el.isTypeOnly) continue;
          if (a.moduleSpecifier) liste.push({ name: el.name.text, ziel: null });
          else liste.push(aufloesen(el.name.text, (el.propertyName ?? el.name).text));
        }
      }
    } else if (
      hatModifier(a, ts.SyntaxKind.ExportKeyword) &&
      !ts.isInterfaceDeclaration(a) &&
      !ts.isTypeAliasDeclaration(a) &&
      !(ts.isImportEqualsDeclaration(a) && a.isTypeOnly)
    ) {
      // Auffangzweig: jeder übrige Export (export import X = …, enum, namespace, …) ist nicht prüfbar.
      const name = ts.getNameOfDeclaration(a as ts.DeclarationStatement);
      liste.push({ name: name && ts.isIdentifier(name) ? name.text : "<export>", ziel: null });
    }
  }
  return liste;
}

function torImportiert(datei: ts.SourceFile, rel: string): boolean {
  for (const a of datei.statements) {
    if (!ts.isImportDeclaration(a) || !ts.isStringLiteral(a.moduleSpecifier)) continue;
    const quelle = a.moduleSpecifier.text;
    const ziel = quelle.startsWith("@/")
      ? quelle.slice(2)
      : quelle.startsWith(".")
        ? join(dirname(rel), quelle).split("\\").join("/")
        : quelle;
    if (ziel.replace(/\.[tj]sx?$/, "") !== TOR_MODUL) continue;
    const namen = a.importClause?.namedBindings;
    if (namen && ts.isNamedImports(namen) && namen.elements.some((el) => el.name.text === "torOffen" && !el.propertyName)) {
      return true;
    }
  }
  return false;
}

function endetMitAusgang(a: ts.Statement): boolean {
  if (ts.isReturnStatement(a) || ts.isThrowStatement(a)) return true;
  if (ts.isBlock(a)) {
    const letzte = a.statements[a.statements.length - 1];
    return !!letzte && endetMitAusgang(letzte);
  }
  return false;
}

/** Genau `if (!(await torOffen())) return|throw …`. */
function istTorPruefung(a: ts.Statement | undefined): boolean {
  if (!a || !ts.isIfStatement(a)) return false;
  const nicht = a.expression;
  if (!ts.isPrefixUnaryExpression(nicht) || nicht.operator !== ts.SyntaxKind.ExclamationToken) return false;
  const klammer = nicht.operand;
  if (!ts.isParenthesizedExpression(klammer) || !ts.isAwaitExpression(klammer.expression)) return false;
  const aufruf = klammer.expression.expression;
  if (!ts.isCallExpression(aufruf) || !ts.isIdentifier(aufruf.expression)) return false;
  if (aufruf.expression.text !== "torOffen" || aufruf.arguments.length !== 0) return false;
  return endetMitAusgang(a.thenStatement);
}

function pruefeFn(fn: Fn, importiert: boolean): string | null {
  if (!fn.body || !ts.isBlock(fn.body)) return G_ERST;
  if (!istTorPruefung(ohneVorrede(fn.body.statements)[0])) return G_ERST;
  return importiert ? null : G_IMPORT;
}

function pruefeBaum(wurzel: string): Ergebnis {
  const ergebnis: Ergebnis = { einstiege: 0, useServer: [], verstoesse: [] };
  for (const rel of sammle(wurzel)) {
    const art = werkbankArt(rel);
    const text = readFileSync(join(wurzel, rel), "utf8");
    if (art === "sonder") {
      ergebnis.verstoesse.push(`${rel}#datei: ${G_SONDER}`);
      continue;
    }
    if (art === null && !text.includes("use server")) continue;
    const datei = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, rel.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const dateiUseServer = hatUseServer(datei.statements);
    const gelistet = NICHT_WERKBANK_ACTIONS.includes(rel);
    if (dateiUseServer) ergebnis.useServer.push(rel);
    const importiert = torImportiert(datei, rel);
    const geprueft = new Set<ts.Node>();
    const melde = (name: string, grund: string | null): void => {
      ergebnis.einstiege += 1;
      if (grund) ergebnis.verstoesse.push(`${rel}#${name}: ${grund}`);
    };
    if (dateiUseServer && !gelistet) {
      for (const e of exporte(datei)) {
        if (e.ziel) geprueft.add(e.ziel);
        melde(e.name, e.ziel ? pruefeFn(e.ziel, importiert) : G_EXPORT);
      }
    } else if (art === "einstieg") {
      const istRoute = /(^|\/)route\.[^/]+$/.test(rel);
      for (const e of exporte(datei)) {
        const einstieg = istRoute ? METHODEN.has(e.name) : e.name === "default";
        if (einstieg) {
          if (e.ziel) geprueft.add(e.ziel);
          melde(e.name, e.ziel ? pruefeFn(e.ziel, importiert) : G_EXPORT);
        } else if (!(CONFIG_EXPORTE.has(e.name) && !e.ziel && istLiteral(e.wert))) {
          ergebnis.verstoesse.push(`${rel}#${e.name}: ${G_ERLAUBT}`);
        }
      }
    }
    if (gelistet) continue;
    const besuche = (knoten: ts.Node): void => {
      if (istFn(knoten) && !geprueft.has(knoten) && knoten.body && ts.isBlock(knoten.body) && hatUseServer(knoten.body.statements)) {
        melde("<inline>", pruefeFn(knoten, importiert));
      }
      ts.forEachChild(knoten, besuche);
    };
    besuche(datei);
  }
  ergebnis.useServer.sort();
  ergebnis.verstoesse.sort();
  return ergebnis;
}

// ---------------------------------------------------------------- Tests

describe("Probelauf-Tor: torOffen auf der Server-Seite", () => {
  it("gültiges Cookie → true; fehlt, abgelaufen, falsch signiert oder Env fehlt → false", async () => {
    const konfig = torKonfig(process.env);
    if (!konfig) throw new Error("Testaufbau: Konfiguration fehlt");
    const gueltig = await erzeugeCookieWert(konfig, Date.now());
    const abgelaufen = await erzeugeCookieWert(konfig, Date.now() - 13 * 60 * 60 * 1000);
    const letztes = gueltig.slice(-1) === "0" ? "1" : "0";
    const falsch = `${gueltig.slice(0, -1)}${letztes}`;
    const ergebnisse: boolean[] = [];
    for (const wert of [gueltig, undefined, abgelaufen, falsch]) {
      krug.clear();
      if (wert !== undefined) krug.set(TOR_COOKIE, wert);
      ergebnisse.push(await torOffen());
    }
    krug.set(TOR_COOKIE, gueltig);
    delete process.env.ZINKEN_MEISTER_CODE;
    ergebnisse.push(await torOffen());
    expect(ergebnisse).toEqual([true, false, false, false, false]);
  });
});

// Zur Sammelzeit gezählt, damit die Zahl im Testnamen steht (auch bei Grün sichtbar).
const ECHT = pruefeBaum(APP);

describe("Probelauf-Tor: Wächter für die Werkbank-Einstiege", () => {
  it(`echter Baum: ${ECHT.einstiege} Werkbank-Einstieg(e), ${ECHT.useServer.length} "use server"-Datei(en), keine Verstöße`, () => {
    // ANKER: Der Wächter darf am echten Baum nie leer grün sein. S3 erweitert den ANKER um die neue Werkbank-Datei.
    // Der ANKER ist bewusst ein eigenes Literal und NICHT aus NICHT_WERKBANK_ACTIONS abgeleitet: die Liste wird
    // NUR für echte Nicht-Werkbank-Actions erweitert — eine Werkbank-Datei dort einzutragen wäre fail-open.
    expect(ECHT.useServer).toEqual(["app/[locale]/beitragen/actions.ts", "app/admin/contributions/actions.ts"]);
    expect(ECHT.verstoesse).toEqual([]);
  });

  const baum = mkdtempSync(join(tmpdir(), "tor-waechter-"));
  afterAll(() => rmSync(baum, { recursive: true, force: true }));

  const IMPORT = `import { torOffen } from "@/lib/zinken/werkbank/tor-server";\n`;
  const PRUEFUNG = `if (!(await torOffen())) return null;`;
  const WERFEN = `if (!(await torOffen())) throw new Error("tor");`;
  const W = "app/[locale]/zinken/werkbank";
  const API = "app/api/zinken/werkbank";
  const ungeprueft = `export default async function Seite() { const d = await lade(); return d; }\n`;
  const fixture: Record<string, string> = {
    // 1–14: Grundfälle
    [`${W}/page.tsx`]: ungeprueft,
    "app/[lang]/ZINKEN/Werkbank/x/page.tsx": ungeprueft,
    [`${API}/x/route.ts`]: `${IMPORT}export async function GET() { if (!(await torOffen())) return new Response(null, { status: 403 }); return new Response("x"); }\nexport async function POST() { return new Response("x"); }\n`,
    [`${W}/a/actions.ts`]: `"use server";\n${IMPORT}export async function a() { ${WERFEN} await tue(); }\nexport async function b() { await tue(); }\n`,
    [`${W}/f5/page.tsx`]: `${IMPORT}export default async function Seite() { ${PRUEFUNG} async function speichere() { "use server"; await tue(); } return speichere; }\n`,
    [`${W}/f6/page.tsx`]: `${IMPORT}export default async function Seite() {\n  // torOffen()\n  return null;\n}\n`,
    "lib/zinken/werkbank/aktionen.ts": `"use server";\nexport async function speichere() { await tue(); }\n`,
    "app/[locale]/zinken/(gruppe)/werkbank/page.tsx": ungeprueft,
    "app/[locale]/zinken/@slot/werkbank/page.tsx": ungeprueft,
    "app/[locale]/zinken/(.)werkbank/page.tsx": ungeprueft,
    [`${W}/layout.tsx`]: `export default async function Rahmen({ children }: { children: unknown }) { return children; }\n`,
    [`${W}/f12/page.tsx`]: `${IMPORT}export default async function Seite() { ${PRUEFUNG} return null; }\nexport async function generateMetadata() { return {}; }\n`,
    [`${W}/f13/page.tsx`]: `async function torOffen() { return true; }\nexport default async function Seite() { ${PRUEFUNG} return null; }\n`,
    [`${W}/f14/page.tsx`]: `${IMPORT}export default async function Seite() { const d = await lade(); ${PRUEFUNG} return d; }\n`,
    // 15–18: Prüfform
    [`${W}/n1/actions.ts`]: `"use server";\n${IMPORT}export async function a() { await torOffen(); await tue(); }\n`,
    [`${W}/n2/actions.ts`]: `"use server";\n${IMPORT}export async function a() { if (!torOffen()) throw new Error("tor"); await tue(); }\n`,
    [`${W}/n3/actions.ts`]: `"use server";\n${IMPORT}export async function a() { const offen = await torOffen(); await tue(); if (!offen) throw new Error("tor"); }\n`,
    [`${W}/n4/actions.ts`]: `"use server";\n${IMPORT}export async function a() { void torOffen(); await tue(); }\n`,
    // 19–24: Exportformen
    [`${W}/n5/actions.ts`]: `"use server";\nasync function b() { await tue(); }\nexport { b };\n`,
    [`${W}/n6/page.tsx`]: `const Seite = async () => { const d = await lade(); return d; };\nexport default Seite;\n`,
    [`${API}/n7/route.ts`]: `export const POST = mitLog(async () => new Response("x"));\n`,
    [`${W}/n8/actions.ts`]: `"use server";\nexport { speichere } from "./intern";\n`,
    [`${W}/n9/actions.ts`]: `"use server";\nexport * from "./intern";\n`,
    [`${API}/n10/route.ts`]: `async function h() { return new Response("x"); }\nexport { h as POST };\n`,
    // 25: Sonderdatei
    [`${W}/opengraph-image.tsx`]: `export default function Bild() { return null; }\n`,
    // 26: Inline-Action als Objekt- und als static-Methode (Next macht beide zur Server-Action) — meldet zweimal
    [`${W}/f26/page.tsx`]: `${IMPORT}const o = { async speichere() { "use server"; await tue(); } };\nclass K { static async sichere() { "use server"; await tue(); } }\nexport default async function Seite() { ${PRUEFUNG} return [o, K]; }\n`,
    // Negativfälle: kein Verstoß
    [`${W}/ok/page.tsx`]: `${IMPORT}export const metadata = { robots: { index: false, follow: false } };\nexport const dynamic = "force-dynamic";\nexport default async function Seite() { if (!(await torOffen())) { return null; } return null; }\n`,
    [`${API}/ok/route.ts`]: `${IMPORT}export async function GET() { if (!(await torOffen())) return new Response(null, { status: 403 }); return new Response("x"); }\nexport async function POST() { if (!(await torOffen())) return new Response(null, { status: 403 }); return new Response("x"); }\n`,
    [`${W}/ok/actions.ts`]: `"use server";\n${IMPORT}export async function a() { ${WERFEN} await tue(); }\nexport const b = async () => { if (!(await torOffen())) return { ok: false }; return { ok: true }; };\n`,
    "app/[locale]/beitragen/actions.ts": `"use server";\nexport async function beitragen() { await tue(); }\n`,
    "app/[locale]/zinken/xr/page.tsx": ungeprueft,
    [`${W}/ok6/page.tsx`]: `${IMPORT}const Seite = async () => { ${PRUEFUNG} return null; };\nexport default Seite;\n`,
    [`${API}/ok10/route.ts`]: `${IMPORT}async function h() { if (!(await torOffen())) return new Response(null, { status: 403 }); return new Response("x"); }\nexport { h as POST };\n`,
    [`${W}/loading.tsx`]: `export default function Laden() { return null; }\n`,
    [`${W}/ok/teil.test.tsx`]: ungeprueft,
  };
  for (const [rel, inhalt] of Object.entries(fixture)) {
    mkdirSync(dirname(join(baum, rel)), { recursive: true });
    writeFileSync(join(baum, rel), inhalt);
  }

  const SOLL_26 = [
    `${W}/page.tsx#default: ${G_ERST}`,
    `app/[lang]/ZINKEN/Werkbank/x/page.tsx#default: ${G_ERST}`,
    `${API}/x/route.ts#POST: ${G_ERST}`,
    `${W}/a/actions.ts#b: ${G_ERST}`,
    `${W}/f5/page.tsx#<inline>: ${G_ERST}`,
    `${W}/f6/page.tsx#default: ${G_ERST}`,
    `lib/zinken/werkbank/aktionen.ts#speichere: ${G_ERST}`,
    `app/[locale]/zinken/(gruppe)/werkbank/page.tsx#default: ${G_ERST}`,
    `app/[locale]/zinken/@slot/werkbank/page.tsx#default: ${G_ERST}`,
    `app/[locale]/zinken/(.)werkbank/page.tsx#default: ${G_ERST}`,
    `${W}/layout.tsx#default: ${G_ERST}`,
    `${W}/f12/page.tsx#generateMetadata: ${G_ERLAUBT}`,
    `${W}/f13/page.tsx#default: ${G_IMPORT}`,
    `${W}/f14/page.tsx#default: ${G_ERST}`,
    `${W}/n1/actions.ts#a: ${G_ERST}`,
    `${W}/n2/actions.ts#a: ${G_ERST}`,
    `${W}/n3/actions.ts#a: ${G_ERST}`,
    `${W}/n4/actions.ts#a: ${G_ERST}`,
    `${W}/n5/actions.ts#b: ${G_ERST}`,
    `${W}/n6/page.tsx#default: ${G_ERST}`,
    `${API}/n7/route.ts#POST: ${G_EXPORT}`,
    `${W}/n8/actions.ts#speichere: ${G_EXPORT}`,
    `${W}/n9/actions.ts#*: ${G_EXPORT}`,
    `${API}/n10/route.ts#POST: ${G_ERST}`,
    `${W}/opengraph-image.tsx#datei: ${G_SONDER}`,
    `${W}/f26/page.tsx#<inline>: ${G_ERST}`,
    `${W}/f26/page.tsx#<inline>: ${G_ERST}`,
  ].sort();

  it("Fixture-Positivprobe: genau die 26 eingebauten Fälle (Fall 26 zweimal), korrekte Formen ohne Verstoß", () => {
    const ergebnis = pruefeBaum(baum);
    expect(ergebnis.verstoesse).toEqual(SOLL_26);
  });
});

describe("Probelauf-Tor: Wächter, Exporte ohne festen Prüfweg", () => {
  const baum = mkdtempSync(join(tmpdir(), "tor-waechter-export-"));
  afterAll(() => rmSync(baum, { recursive: true, force: true }));

  const IMPORT = `import { torOffen } from "@/lib/zinken/werkbank/tor-server";\n`;
  const PRUEFUNG = `if (!(await torOffen())) return null;`;
  const W = "app/[locale]/zinken/werkbank";
  const API = "app/api/zinken/werkbank";
  const GEPRUEFT = `async () => { if (!(await torOffen())) return new Response(null, { status: 403 }); return new Response("x"); }`;
  const fixture: Record<string, string> = {
    [`${API}/e1/route.ts`]: `import * as H from "./h";\nexport import POST = H.POST;\n`,
    [`${API}/e2/route.ts`]: `${IMPORT}export let POST = ${GEPRUEFT};\nPOST = async () => new Response("x");\n`,
    [`${W}/e3/actions.ts`]: `"use server";\n${IMPORT}let b = ${GEPRUEFT};\nb = async () => new Response("x");\nexport { b };\n`,
    [`${W}/e4/page.tsx`]: `${IMPORT}export enum Art { A }\nexport default async function Seite() { ${PRUEFUNG} return null; }\n`,
    [`${API}/e5/route.ts`]: `export namespace POST { export const x = 1; }\n`,
    [`${W}/e6/page.tsx`]: `export default class Seite {}\n`,
    // Negativfall: reine Typ-Exporte verschwinden beim Übersetzen
    [`${W}/ok/page.tsx`]: `${IMPORT}export type P = { a: string };\nexport interface Q { b: number }\nexport default async function Seite() { ${PRUEFUNG} return null; }\n`,
  };
  for (const [rel, inhalt] of Object.entries(fixture)) {
    mkdirSync(dirname(join(baum, rel)), { recursive: true });
    writeFileSync(join(baum, rel), inhalt);
  }

  const SOLL = [
    `${API}/e1/route.ts#POST: ${G_EXPORT}`,
    `${API}/e2/route.ts#POST: ${G_EXPORT}`,
    `${W}/e3/actions.ts#b: ${G_EXPORT}`,
    `${W}/e4/page.tsx#Art: ${G_ERLAUBT}`,
    `${API}/e5/route.ts#POST: ${G_EXPORT}`,
    `${W}/e6/page.tsx#default: ${G_EXPORT}`,
  ].sort();

  it("export import, let/var, enum, namespace und default class → nicht prüfbar bzw. nicht erlaubt", () => {
    expect(pruefeBaum(baum).verstoesse).toEqual(SOLL);
  });
});
