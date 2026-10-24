import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, posix, relative, resolve } from "node:path";
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

/** Ordner, die der Wächter in jeder Tiefe überspringt (Fremdcode und Next-Build). */
const UEBERALL = new Set(["node_modules", ".next"]);
/** Ordner, die er NUR im App-Wurzelordner überspringt: dist (wie tsconfig exclude) und .vercel (Build-Ausgabe
 *  von `vercel build`, steht in .gitignore). public/ und coverage/ kompiliert tsconfig mit, sie sind importierbar
 *  und werden gelesen; tiefer ist z. B. …/werkbank/public/page.tsx eine echte Route, und lib/.vercel/ wird gelesen
 *  (fail-closed). Ein Import dorthin (über @/ oder relativ) ist ein Verstoß (G_BUILD): tsconfig kompiliert eine
 *  importierte Datei trotz exclude mit, der Wächter liest sie aber nicht. */
const NUR_WURZEL = new Set(["dist", ".vercel"]);
/** Datei-"use server" außerhalb der Werkbank. NUR echte Nicht-Werkbank-Actions eintragen, sonst fail-open. */
const NICHT_WERKBANK_ACTIONS = ["app/[locale]/beitragen/actions.ts", "app/admin/contributions/actions.ts"];
const EINSTIEG_DATEIEN = new Set(["page", "layout", "template", "default", "route"]);
/**
 * Next-Konventionsdateien, die kein Einstieg sind, Stand Next 15.5 (Bild-Sonderdateien auch mit einer Ziffer,
 * z. B. icon1). Unter der Werkbank sind sie alle verboten (fail-closed): loading rendert als Suspense-Rand,
 * während torOffen() noch läuft; error/not-found/forbidden/unauthorized rendern ohne das Tor der Seite.
 */
const SONDERDATEI =
  /^(?:(?:opengraph-image|twitter-image|icon|apple-icon)\d?|sitemap|robots|manifest|loading|error|global-error|not-found|global-not-found|forbidden|unauthorized)$/;
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
/** Gemeinsames Paket (transpilePackages): kein Werkbank-Einstieg, dort ist jede Server-Action verboten. */
const CORE_SRC = resolve(APP, "../../packages/core/src");

const G_ERST = "erste Anweisung ist nicht if (!(await torOffen())) return|throw";
const G_IMPORT = "torOffen nicht aus tor-server importiert";
const G_EXPORT = "Export nicht prüfbar";
const G_ERLAUBT = "Export in Werkbank-Datei nicht erlaubt";
const G_SONDER = "Sonderdatei unter der Werkbank";
const G_SCHATTEN = "torOffen in der Datei neu gebunden";
const G_AUSGANG = "Ausgang des Tors passt nicht zur Art (Seite null, Route 403 ohne Inhalt, Action throw oder { ok: false })";
const G_ROBOTS = "metadata ohne robots noindex";
const G_SYMLINK = "Symlink im Baum (nicht gelesen, fail-closed)";
const G_BUILD = "Import aus der Build-Ausgabe (dist/ oder .vercel/ im App-Wurzelordner, nicht gelesen)";

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

/** Quelldatei im Sinne des Wächters: JS/TS-Endung, keine Testdatei. */
function istQuelle(name: string): boolean {
  return /\.(tsx?|jsx?|mjs|mts|cts|cjs)$/.test(name) && !/\.test\.[tj]sx?$/.test(name);
}

/** Folgt dem Symlink; ein toter Link oder eine Schleife gilt nicht als Ordner. */
function zeigtAufOrdner(pfad: string): boolean {
  try {
    return statSync(pfad).isDirectory();
  } catch {
    return false;
  }
}

/** import(…) oder require(…) */
function istLaden(aufruf: ts.CallExpression): boolean {
  const f = aufruf.expression;
  return f.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(f) && f.text === "require");
}

/** Modulpfade einer Datei, die in dist/ oder .vercel/ im App-Wurzelordner zeigen (über @/ oder relativ). */
function buildImporte(rel: string, text: string): string[] {
  const datei = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, rel.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const treffer: string[] = [];
  const pruefe = (spez: ts.Node | undefined): void => {
    if (!spez || !ts.isStringLiteralLike(spez)) return;
    const quelle = spez.text;
    const ziel = quelle.startsWith("@/")
      ? posix.normalize(quelle.slice(2))
      : quelle.startsWith(".")
        ? posix.join(posix.dirname(rel), quelle)
        : null;
    if (ziel !== null && NUR_WURZEL.has((ziel.split("/")[0] ?? "").toLowerCase())) treffer.push(quelle);
  };
  const besuche = (k: ts.Node): void => {
    if (ts.isImportDeclaration(k) || ts.isExportDeclaration(k)) pruefe(k.moduleSpecifier);
    else if (ts.isExternalModuleReference(k)) pruefe(k.expression);
    else if (ts.isCallExpression(k) && istLaden(k)) pruefe(k.arguments[0]);
    ts.forEachChild(k, besuche);
  };
  besuche(datei);
  return treffer;
}

/**
 * Alle Quelldateien unter wurzel (ganzer Baum, fail-closed), ohne UEBERALL/NUR_WURZEL und ohne Testdateien.
 * Symlinks liest der Wächter nicht, Next folgt ihnen aber: Symlinks auf Ordner und auf Quelldateien (istQuelle)
 * landen in `symlinks` und werden gemeldet. Andere (z. B. .env.local, Bilder, Fonts) sind keine Route und bleiben
 * ohne Befund; ein toter Link zählt nur über seinen Namen.
 */
function sammle(wurzel: string, symlinks: string[] = []): string[] {
  const dateien: string[] = [];
  const laufe = (ordner: string): void => {
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      const pfad = join(ordner, eintrag.name);
      const rel = relative(wurzel, pfad).split("\\").join("/");
      const ausgenommen = UEBERALL.has(eintrag.name) || (ordner === wurzel && NUR_WURZEL.has(eintrag.name));
      if (eintrag.isSymbolicLink()) {
        if (!ausgenommen && (istQuelle(eintrag.name) || zeigtAufOrdner(pfad))) symlinks.push(rel);
      } else if (eintrag.isDirectory()) {
        if (!ausgenommen) laufe(pfad);
      } else if (istQuelle(eintrag.name)) {
        dateien.push(rel);
      }
    }
  };
  laufe(wurzel);
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

function ohneHuelle(wert: ts.Expression): ts.Expression {
  let w = wert;
  while (ts.isAsExpression(w) || ts.isSatisfiesExpression(w) || ts.isParenthesizedExpression(w)) w = w.expression;
  return w;
}

/**
 * Ein fester Wert ohne Auswertung: Literale und Objekt-/Array-Literale daraus (tief); keine Aufrufe, Namen, Spreads.
 * `undefined` nur, wenn die Datei den Namen nirgends selbst bindet.
 */
function reinerWert(wert: ts.Expression | undefined): boolean {
  if (!wert) return false;
  const w = ohneHuelle(wert);
  if (
    ts.isStringLiteral(w) ||
    ts.isNoSubstitutionTemplateLiteral(w) ||
    ts.isNumericLiteral(w) ||
    w.kind === ts.SyntaxKind.NullKeyword ||
    w.kind === ts.SyntaxKind.TrueKeyword ||
    w.kind === ts.SyntaxKind.FalseKeyword ||
    (ts.isIdentifier(w) && w.text === "undefined" && bindungenVon(w.getSourceFile(), "undefined") === 0)
  ) {
    return true;
  }
  if (ts.isPrefixUnaryExpression(w)) return w.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(w.operand);
  if (ts.isArrayLiteralExpression(w)) return w.elements.every((el) => !ts.isSpreadElement(el) && reinerWert(el));
  if (ts.isObjectLiteralExpression(w)) {
    return w.properties.every(
      (p) => ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) && reinerWert(p.initializer),
    );
  }
  return false;
}

/** Alle Werte der Eigenschaft `name` im Objekt-Literal (mehrfach möglich, der letzte gewinnt zur Laufzeit). */
function eigenschaft(objekt: ts.ObjectLiteralExpression, name: string): ts.Expression[] {
  return objekt.properties.flatMap((p) =>
    ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) && p.name.text === name
      ? [ohneHuelle(p.initializer)]
      : [],
  );
}

/** metadata hat genau ein robots: einen String mit dem Token noindex (kommagetrennt) oder ein Objekt mit genau einem index: false. */
function robotsNoindex(wert: ts.Expression | undefined): boolean {
  const w = wert && ohneHuelle(wert);
  if (!w || !ts.isObjectLiteralExpression(w)) return false;
  const robots = eigenschaft(w, "robots");
  const [r] = robots;
  if (robots.length !== 1 || !r) return false;
  if (ts.isStringLiteral(r) || ts.isNoSubstitutionTemplateLiteral(r)) {
    return r.text.split(",").some((teil) => teil.trim().toLowerCase() === "noindex");
  }
  if (!ts.isObjectLiteralExpression(r)) return false;
  const index = eigenschaft(r, "index");
  return index.length === 1 && index[0]?.kind === ts.SyntaxKind.FalseKeyword;
}

/** Die Datei hat einen Import von "server-only". */
function importiertServerOnly(rel: string, text: string): boolean {
  if (!text.includes("server-only")) return false;
  const datei = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, false, rel.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  return datei.statements.some(
    (a) => ts.isImportDeclaration(a) && ts.isStringLiteral(a.moduleSpecifier) && a.moduleSpecifier.text === "server-only",
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

/** Knotenarten, deren `name` einen Wert-Namen bindet (Typnamen binden keinen Wert). */
const BINDUNGEN = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.VariableDeclaration,
  ts.SyntaxKind.Parameter,
  ts.SyntaxKind.BindingElement,
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.FunctionExpression,
  ts.SyntaxKind.ClassDeclaration,
  ts.SyntaxKind.ClassExpression,
  ts.SyntaxKind.ImportSpecifier,
  ts.SyntaxKind.ImportClause,
  ts.SyntaxKind.NamespaceImport,
  ts.SyntaxKind.ImportEqualsDeclaration,
  ts.SyntaxKind.EnumDeclaration,
  ts.SyntaxKind.ModuleDeclaration,
]);

/**
 * Wie oft `name` in der ganzen Datei als Wert gebunden ist. Dateiweit statt nur in der Funktion: eine Bindung auf
 * Modulebene oder in einer umgebenden Funktion verdeckt den Namen genauso (auch catch-Variable, Parameter-Default,
 * Destrukturierung, gehobene innere function, Import).
 */
function bindungenVon(datei: ts.SourceFile, name: string): number {
  let bindungen = 0;
  const besuche = (knoten: ts.Node): void => {
    if (
      ts.isIdentifier(knoten) &&
      knoten.text === name &&
      BINDUNGEN.has(knoten.parent.kind) &&
      (knoten.parent as ts.NamedDeclaration).name === knoten
    ) {
      bindungen += 1;
    }
    ts.forEachChild(knoten, besuche);
  };
  besuche(datei);
  return bindungen;
}

/** true, wenn `torOffen` in der ganzen Datei genau einmal gebunden ist (der Import, siehe torImportiert). */
function torNurImportiert(datei: ts.SourceFile): boolean {
  return bindungenVon(datei, "torOffen") === 1;
}

/** Wofür ein Einstieg steht; danach richtet sich der erlaubte Ausgang des Tors (Regel in tor-server.ts). */
type Art = "seite" | "route" | "action";

/** `new <name>(…)` mit dem Built-in: die Datei bindet den Namen nirgends selbst (sonst fail-closed). */
function builtinNeu(w: ts.Expression, name: string): w is ts.NewExpression {
  return ts.isNewExpression(w) && ts.isIdentifier(w.expression) && w.expression.text === name && bindungenVon(w.getSourceFile(), name) === 0;
}

/** Objekt-Literal als reiner Wert mit genau einer Eigenschaft `name`, und die erfüllt `passt`. */
function mitEigenschaft(wert: ts.Expression | undefined, name: string, passt: (w: ts.Expression) => boolean): boolean {
  const o = wert && ohneHuelle(wert);
  if (!o || !ts.isObjectLiteralExpression(o) || !reinerWert(o)) return false;
  const [nur, ...mehr] = eigenschaft(o, name);
  return nur !== undefined && mehr.length === 0 && passt(nur);
}

function istNull(wert: ts.Expression | undefined): boolean {
  return wert !== undefined && ohneHuelle(wert).kind === ts.SyntaxKind.NullKeyword;
}

/**
 * Ausgang des Tors je Art, nur mit reinen Werten, nichts, was liest oder rechnet:
 * - Seite/Layout: `return;` | `return null` | `return undefined` (kein Inhalt),
 * - Route-Handler: `return new Response(null, { status: 403, … })` (ohne Inhalt),
 * - Action: `throw new Error(W?)` | `throw W` | `return { ok: false, … }`.
 */
function festerAusgang(anweisung: ts.ReturnStatement | ts.ThrowStatement, art: Art): boolean {
  if (ts.isThrowStatement(anweisung)) {
    if (art !== "action") return false;
    const w = ohneHuelle(anweisung.expression);
    if (reinerWert(w)) return true;
    if (!builtinNeu(w, "Error")) return false;
    const argumente: readonly ts.Expression[] = w.arguments ?? [];
    return argumente.length <= 1 && argumente.every((a) => reinerWert(a));
  }
  const wert = anweisung.expression;
  if (art === "seite") {
    if (!wert || istNull(wert)) return true;
    const w = ohneHuelle(wert);
    return ts.isIdentifier(w) && w.text === "undefined" && reinerWert(w);
  }
  if (!wert) return false;
  const w = ohneHuelle(wert);
  if (art === "route") {
    if (!builtinNeu(w, "Response")) return false;
    const [inhalt, optionen, ...mehr] = w.arguments ?? [];
    return istNull(inhalt) && mehr.length === 0 && mitEigenschaft(optionen, "status", (s) => ts.isNumericLiteral(s) && s.text === "403");
  }
  return mitEigenschaft(w, "ok", (ok) => ok.kind === ts.SyntaxKind.FalseKeyword);
}

/** then-Zweig des Tors: genau eine Anweisung (auch als Block): return … | throw … mit dem festen Ausgang der Art. */
function istAusgang(a: ts.Statement, art: Art): boolean {
  let anweisung = a;
  if (ts.isBlock(anweisung)) {
    const [nur] = anweisung.statements;
    if (anweisung.statements.length !== 1 || !nur) return false;
    anweisung = nur;
  }
  if (ts.isReturnStatement(anweisung) || ts.isThrowStatement(anweisung)) return festerAusgang(anweisung, art);
  return false;
}

/** Die Anweisung ist ein if mit genau der Bedingung `!(await torOffen())`. */
function istTorBedingung(a: ts.Statement | undefined): a is ts.IfStatement {
  if (!a || !ts.isIfStatement(a)) return false;
  const nicht = a.expression;
  if (!ts.isPrefixUnaryExpression(nicht) || nicht.operator !== ts.SyntaxKind.ExclamationToken) return false;
  const klammer = nicht.operand;
  if (!ts.isParenthesizedExpression(klammer) || !ts.isAwaitExpression(klammer.expression)) return false;
  const aufruf = klammer.expression.expression;
  if (!ts.isCallExpression(aufruf) || !ts.isIdentifier(aufruf.expression)) return false;
  return aufruf.expression.text === "torOffen" && aufruf.arguments.length === 0;
}

interface TorDatei {
  importiert: boolean;
  nurImportiert: boolean;
}

/**
 * Ist die erste Anweisung (nach der Vorrede) wirklich DAS Tor? Der erste Treffer in dieser Rangfolge gewinnt:
 * G_ERST (Form) > G_IMPORT (kein Import ohne as) > G_SCHATTEN (weitere Bindung neben dem Import) > G_AUSGANG.
 */
function istTor(fn: Fn, tor: TorDatei, art: Art): string | null {
  if (!fn.body || !ts.isBlock(fn.body)) return G_ERST;
  const erste = ohneVorrede(fn.body.statements)[0];
  if (!istTorBedingung(erste)) return G_ERST;
  if (!tor.importiert) return G_IMPORT;
  if (!tor.nurImportiert) return G_SCHATTEN;
  return istAusgang(erste.thenStatement, art) ? null : G_AUSGANG;
}

function pruefeBaum(wurzel: string): Ergebnis {
  const ergebnis: Ergebnis = { einstiege: 0, useServer: [], verstoesse: [] };
  const symlinks: string[] = [];
  for (const rel of sammle(wurzel, symlinks)) {
    const art = werkbankArt(rel);
    const text = readFileSync(join(wurzel, rel), "utf8");
    for (const quelle of buildImporte(rel, text)) ergebnis.verstoesse.push(`${rel}#import ${quelle}: ${G_BUILD}`);
    if (art === "sonder") {
      ergebnis.verstoesse.push(`${rel}#datei: ${G_SONDER}`);
      continue;
    }
    if (art === null && !text.includes("use server")) continue;
    const datei = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, rel.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const dateiUseServer = hatUseServer(datei.statements);
    const gelistet = NICHT_WERKBANK_ACTIONS.includes(rel);
    if (dateiUseServer) ergebnis.useServer.push(rel);
    const tor: TorDatei = { importiert: torImportiert(datei, rel), nurImportiert: torNurImportiert(datei) };
    const geprueft = new Set<ts.Node>();
    const melde = (name: string, grund: string | null): void => {
      ergebnis.einstiege += 1;
      if (grund) ergebnis.verstoesse.push(`${rel}#${name}: ${grund}`);
    };
    if (dateiUseServer && !gelistet) {
      for (const e of exporte(datei)) {
        if (e.ziel) geprueft.add(e.ziel);
        melde(e.name, e.ziel ? istTor(e.ziel, tor, "action") : G_EXPORT);
      }
    } else if (art === "einstieg") {
      const istRoute = /(^|\/)route\.[^/]+$/.test(rel);
      for (const e of exporte(datei)) {
        const einstieg = istRoute ? METHODEN.has(e.name) : e.name === "default";
        if (einstieg) {
          if (e.ziel) geprueft.add(e.ziel);
          melde(e.name, e.ziel ? istTor(e.ziel, tor, istRoute ? "route" : "seite") : G_EXPORT);
        } else if (!(CONFIG_EXPORTE.has(e.name) && !e.ziel && reinerWert(e.wert))) {
          ergebnis.verstoesse.push(`${rel}#${e.name}: ${G_ERLAUBT}`);
        } else if (e.name === "metadata" && !robotsNoindex(e.wert)) {
          ergebnis.verstoesse.push(`${rel}#${e.name}: ${G_ROBOTS}`);
        }
      }
    }
    if (gelistet) continue;
    const besuche = (knoten: ts.Node): void => {
      if (istFn(knoten) && !geprueft.has(knoten) && knoten.body && ts.isBlock(knoten.body) && hatUseServer(knoten.body.statements)) {
        melde("<inline>", istTor(knoten, tor, "action"));
      }
      ts.forEachChild(knoten, besuche);
    };
    besuche(datei);
  }
  for (const rel of symlinks) ergebnis.verstoesse.push(`${rel}#datei: ${G_SYMLINK}`);
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

  it("echter Baum: server-only ist echte Abhängigkeit", () => {
    // Next löst server-only intern über einen Alias auf; ohne eigene Abhängigkeit hinge der Schutz an diesem Alias.
    const paket = JSON.parse(readFileSync(join(APP, "package.json"), "utf8")) as { dependencies?: Record<string, string> };
    const ohneAbhaengigkeit =
      paket.dependencies?.["server-only"] === undefined
        ? sammle(APP).filter((rel) => importiertServerOnly(rel, readFileSync(join(APP, rel), "utf8")))
        : [];
    expect(ohneAbhaengigkeit).toEqual([]);
  });

  it("packages/core/src: keine Server-Action", () => {
    // Ein Paket ist kein Werkbank-Einstieg: dort gibt es nichts zu gaten, jede Server-Action ist verboten.
    const core = pruefeBaum(CORE_SRC);
    expect(core.useServer).toEqual([]);
    expect(core.einstiege).toBe(0);
    expect(core.verstoesse).toEqual([]);
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
    // 27–30: torOffen neben dem Import neu gebunden (dateiweit)
    [`${W}/f27/page.tsx`]: `${IMPORT}export default async function Seite() { ${PRUEFUNG} async function torOffen() { return true; } return null; }\n`,
    [`${W}/f28/page.tsx`]: `${IMPORT}export default async function Seite(torOffen = async () => true) { ${PRUEFUNG} return null; }\n`,
    [`${W}/f29/page.tsx`]: `${IMPORT}export default async function Seite() { ${PRUEFUNG} var torOffen = async () => true; return null; }\n`,
    [`${W}/f30/page.tsx`]: `${IMPORT}const torOffen = async () => true;\nexport default async function Seite() { ${PRUEFUNG} return null; }\n`,
    // 31–34: Ausgang des Tors nicht genau eine Anweisung mit festem Wert
    [`${W}/f31/page.tsx`]: `${IMPORT}export default async function Seite() { if (!(await torOffen())) { await schreibe(); return null; } return null; }\n`,
    [`${W}/f32/page.tsx`]: `${IMPORT}export default async function Seite() { if (!(await torOffen())) return await ladeGeheim(); return null; }\n`,
    [`${W}/f33/page.tsx`]: `${IMPORT}export default async function Seite() { if (!(await torOffen())) return lade(); return null; }\n`,
    [`${W}/f34/actions.ts`]: `"use server";\n${IMPORT}export async function a() { if (!(await torOffen())) throw fehler(x); await tue(); }\n`,
    // 35–37: "use server" außerhalb von app/lib/components (ganzer App-Baum, auch .mts)
    "i18n/x.ts": `"use server";\nexport async function x() { await tue(); }\n`,
    "server/x.ts": `"use server";\nexport async function x() { await tue(); }\n`,
    "x.mts": `"use server";\nexport async function x() { await tue(); }\n`,
    // 38–41: Konventionsdateien unter der Werkbank
    [`${W}/loading.tsx`]: `export default function Laden() { return null; }\n`,
    [`${W}/not-found.tsx`]: `export default function Fehlt() { return null; }\n`,
    [`${W}/forbidden.tsx`]: `export default function Verboten() { return null; }\n`,
    [`${W}/error.tsx`]: `export default function Fehler() { return null; }\n`,
    // 42–45: Config-Exporte nur als reiner Wert, metadata nur mit robots noindex
    [`${W}/f42/page.tsx`]: `${IMPORT}export const metadata = { robots: { index: true } };\nexport default async function Seite() { ${PRUEFUNG} return null; }\n`,
    [`${W}/f43/page.tsx`]: `${IMPORT}export const metadata = { title: "Werkbank" };\nexport default async function Seite() { ${PRUEFUNG} return null; }\n`,
    [`${W}/f44/page.tsx`]: `${IMPORT}export const metadata = { title: lade(), robots: "noindex" };\nexport default async function Seite() { ${PRUEFUNG} return null; }\n`,
    [`${W}/f45/page.tsx`]: `${IMPORT}export const dynamic = String(x);\nexport default async function Seite() { ${PRUEFUNG} return null; }\n`,
    // 46–47: public/ und dist/ tiefer im Baum werden gelesen
    [`${W}/public/page.tsx`]: ungeprueft,
    "lib/dist/x.ts": `"use server";\nexport async function x() { await tue(); }\n`,
    // 48: Response in der Datei selbst gebunden → kein fester Ausgang
    [`${API}/f48/route.ts`]: `${IMPORT}class Response { constructor() { schreibe(); } }\nexport async function GET() { if (!(await torOffen())) return new Response(null, { status: 403 }); return null; }\n`,
    // 49–50: public/ und coverage/ im App-Wurzelordner werden gelesen (tsconfig kompiliert sie mit; nur dist/ fällt weg)
    "public/x.ts": `"use server";\nexport async function x() { await tue(); }\n`,
    "coverage/x.ts": `"use server";\nexport async function x() { await tue(); }\n`,
    // 51–54: Ausgang je Art (Seite null, Route 403 ohne Inhalt, Action throw oder { ok: false })
    [`${API}/f51/route.ts`]: `${IMPORT}export async function GET() { if (!(await torOffen())) return; return new Response("x"); }\n`,
    [`${API}/f52/route.ts`]: `${IMPORT}export async function GET() { if (!(await torOffen())) return new Response("ok", { status: 200 }); return new Response("x"); }\n`,
    [`${W}/f53/page.tsx`]: `${IMPORT}export default async function Seite() { if (!(await torOffen())) return "geheim"; return null; }\n`,
    [`${W}/f54/actions.ts`]: `"use server";\n${IMPORT}export async function a() { if (!(await torOffen())) return { ok: true }; await tue(); }\n`,
    // 55–56: robots nur mit dem exakten Token noindex
    [`${W}/f55/page.tsx`]: `${IMPORT}export const metadata = { robots: "noindexing" };\nexport default async function Seite() { ${PRUEFUNG} return null; }\n`,
    [`${W}/f56/page.tsx`]: `${IMPORT}export const metadata = { robots: "x-noindex, nofollow" };\nexport default async function Seite() { ${PRUEFUNG} return null; }\n`,
    // 57: Symlink-Ordner unter der Werkbank (Ziel unten, nach dem Schreiben) → gemeldet statt still übersprungen
    "quelle/sym/page.tsx": ungeprueft,
    // 58–60: .vercel/ fällt nur als App-Wurzelordner weg (Build-Ausgabe, in .gitignore); dieselbe Datei unter app/,
    //        tiefer im Baum und in einem Ordner mit gleichem Anfang wird gelesen
    "app/v58/x.ts": `"use server";\nexport async function x() { await tue(); }\n`,
    "lib/.vercel/x.ts": `"use server";\nexport async function x() { await tue(); }\n`,
    ".vercel2/x.ts": `"use server";\nexport async function x() { await tue(); }\n`,
    // 61–65: Einzelatome des Ausgangs, je genau eine Abweichung (Route: nur Inhalt · nur Status · throw; Seite throw;
    //        Action `return;`)
    [`${API}/f61/route.ts`]: `${IMPORT}export async function GET() { if (!(await torOffen())) return new Response("x", { status: 403 }); return new Response("x"); }\n`,
    [`${API}/f62/route.ts`]: `${IMPORT}export async function GET() { if (!(await torOffen())) return new Response(null, { status: 200 }); return new Response("x"); }\n`,
    [`${W}/f63/page.tsx`]: `${IMPORT}export default async function Seite() { if (!(await torOffen())) throw new Error("tor"); return null; }\n`,
    [`${W}/f64/actions.ts`]: `"use server";\n${IMPORT}export async function a() { if (!(await torOffen())) return; await tue(); }\n`,
    [`${API}/f65/route.ts`]: `${IMPORT}export async function GET() { if (!(await torOffen())) throw new Error("tor"); return new Response("x"); }\n`,
    // 67: Symlink auf eine .ts-Datei unter der Werkbank (Ziel hier, Link unten) → gemeldet
    "quelle/x67.ts": `export const x = 1;\n`,
    // 68–70: Import aus der Build-Ausgabe im App-Wurzelordner: über @/, relativ als Re-Export, dynamisch mit .. und
    //        Großbuchstaben (macOS-Dateisystem) → gemeldet, obwohl der Wächter dist/ und .vercel/ nicht liest
    "lib/f68.ts": `import { x } from "@/.vercel/x";\nexport const y = x;\n`,
    "lib/f69.ts": `export { x } from "../dist/x";\n`,
    "lib/f70.ts": `export async function lade() { return import("@/lib/../Dist/x"); }\n`,
    // Negativfälle: kein Verstoß
    // kein Build-Import: lib/dist tiefer im Baum, .vercel2, Paketname mit dist
    "lib/ok-build.ts": `import { a } from "@/lib/dist/x";\nimport { b } from "@/.vercel2/x";\nimport c from "dist-paket";\nexport const d = [a, b, c];\n`,
    // Ziele für Symlinks ohne Befund (unten)
    "quelle/bild.png": "png",
    "quelle/env": "X=1\n",
    "dist/x.ts": `"use server";\nexport async function x() { await tue(); }\n`,
    ".vercel/output/x.ts": `"use server";\nexport async function x() { await tue(); }\n`,
    [`${W}/ok/page.tsx`]: `${IMPORT}export const metadata = { robots: { index: false, follow: false } };\nexport const dynamic = "force-dynamic";\nexport default async function Seite() { if (!(await torOffen())) { return null; } return null; }\n`,
    [`${API}/ok/route.ts`]: `${IMPORT}export async function GET() { if (!(await torOffen())) return new Response(null, { status: 403 }); return new Response("x"); }\nexport async function POST() { if (!(await torOffen())) return new Response(null, { status: 403 }); return new Response("x"); }\n`,
    [`${W}/ok/actions.ts`]: `"use server";\n${IMPORT}export async function a() { ${WERFEN} await tue(); }\nexport const b = async () => { if (!(await torOffen())) return { ok: false }; return { ok: true }; };\n`,
    "app/[locale]/beitragen/actions.ts": `"use server";\nexport async function beitragen() { await tue(); }\n`,
    "app/[locale]/zinken/xr/page.tsx": ungeprueft,
    [`${W}/ok6/page.tsx`]: `${IMPORT}const Seite = async () => { ${PRUEFUNG} return null; };\nexport default Seite;\n`,
    [`${API}/ok10/route.ts`]: `${IMPORT}async function h() { if (!(await torOffen())) return new Response(null, { status: 403 }); return new Response("x"); }\nexport { h as POST };\n`,
    [`${W}/ok7/page.tsx`]: `${IMPORT}export const metadata = { title: "Werkbank", robots: "noindex, nofollow" } as const;\nexport const revalidate = 0;\nexport default async function Seite() { if (!(await torOffen())) { return; } return null; }\n`,
    [`${W}/ok/teil.test.tsx`]: ungeprueft,
  };
  for (const [rel, inhalt] of Object.entries(fixture)) {
    mkdirSync(dirname(join(baum, rel)), { recursive: true });
    writeFileSync(join(baum, rel), inhalt);
  }
  symlinkSync(join(baum, "quelle/sym"), join(baum, `${W}/sym`), "dir");
  // 66: Datei-Symlink unter der Werkbank → ebenso gemeldet
  symlinkSync(join(baum, "quelle/sym/page.tsx"), join(baum, `${W}/f66.tsx`), "file");
  // 67: Datei-Symlink auf .ts → gemeldet
  symlinkSync(join(baum, "quelle/x67.ts"), join(baum, `${W}/f67.ts`), "file");
  // Negativ: Symlinks auf ein Bild (unter der Werkbank) und auf .env.local (App-Wurzel) → kein Befund
  symlinkSync(join(baum, "quelle/bild.png"), join(baum, `${W}/bild.png`), "file");
  symlinkSync(join(baum, "quelle/env"), join(baum, ".env.local"), "file");

  const SOLL_70 = [
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
    `${W}/f27/page.tsx#default: ${G_SCHATTEN}`,
    `${W}/f28/page.tsx#default: ${G_SCHATTEN}`,
    `${W}/f29/page.tsx#default: ${G_SCHATTEN}`,
    `${W}/f30/page.tsx#default: ${G_SCHATTEN}`,
    `${W}/f31/page.tsx#default: ${G_AUSGANG}`,
    `${W}/f32/page.tsx#default: ${G_AUSGANG}`,
    `${W}/f33/page.tsx#default: ${G_AUSGANG}`,
    `${W}/f34/actions.ts#a: ${G_AUSGANG}`,
    `i18n/x.ts#x: ${G_ERST}`,
    `server/x.ts#x: ${G_ERST}`,
    `x.mts#x: ${G_ERST}`,
    `${W}/loading.tsx#datei: ${G_SONDER}`,
    `${W}/not-found.tsx#datei: ${G_SONDER}`,
    `${W}/forbidden.tsx#datei: ${G_SONDER}`,
    `${W}/error.tsx#datei: ${G_SONDER}`,
    `${W}/f42/page.tsx#metadata: ${G_ROBOTS}`,
    `${W}/f43/page.tsx#metadata: ${G_ROBOTS}`,
    `${W}/f44/page.tsx#metadata: ${G_ERLAUBT}`,
    `${W}/f45/page.tsx#dynamic: ${G_ERLAUBT}`,
    `${W}/public/page.tsx#default: ${G_ERST}`,
    `lib/dist/x.ts#x: ${G_ERST}`,
    `${API}/f48/route.ts#GET: ${G_AUSGANG}`,
    `public/x.ts#x: ${G_ERST}`,
    `coverage/x.ts#x: ${G_ERST}`,
    `${API}/f51/route.ts#GET: ${G_AUSGANG}`,
    `${API}/f52/route.ts#GET: ${G_AUSGANG}`,
    `${W}/f53/page.tsx#default: ${G_AUSGANG}`,
    `${W}/f54/actions.ts#a: ${G_AUSGANG}`,
    `${W}/f55/page.tsx#metadata: ${G_ROBOTS}`,
    `${W}/f56/page.tsx#metadata: ${G_ROBOTS}`,
    `${W}/sym#datei: ${G_SYMLINK}`,
    `app/v58/x.ts#x: ${G_ERST}`,
    `lib/.vercel/x.ts#x: ${G_ERST}`,
    `.vercel2/x.ts#x: ${G_ERST}`,
    `${API}/f61/route.ts#GET: ${G_AUSGANG}`,
    `${API}/f62/route.ts#GET: ${G_AUSGANG}`,
    `${W}/f63/page.tsx#default: ${G_AUSGANG}`,
    `${W}/f64/actions.ts#a: ${G_AUSGANG}`,
    `${API}/f65/route.ts#GET: ${G_AUSGANG}`,
    `${W}/f66.tsx#datei: ${G_SYMLINK}`,
    `${W}/f67.ts#datei: ${G_SYMLINK}`,
    `lib/f68.ts#import @/.vercel/x: ${G_BUILD}`,
    `lib/f69.ts#import ../dist/x: ${G_BUILD}`,
    `lib/f70.ts#import @/lib/../Dist/x: ${G_BUILD}`,
  ].sort();

  it("Fixture-Positivprobe: genau die 70 eingebauten Fälle (Fall 26 zweimal), korrekte Formen ohne Verstoß", () => {
    const ergebnis = pruefeBaum(baum);
    expect(ergebnis.verstoesse).toEqual(SOLL_70);
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
