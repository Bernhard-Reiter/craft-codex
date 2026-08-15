/**
 * ESLint flat config — die Brücke, die den Wächter wieder scharf macht.
 *
 * WARUM ES DIESE DATEI GIBT (gemessen 15.08.2026, nicht vermutet):
 *
 * Das Projekt lief auf `.eslintrc.json`, installiert ist aber ESLint 9. Ab v9
 * ist Flat Config das Standardformat; eine `.eslintrc.json` wird nicht mehr
 * gelesen. Folge war KEIN Fehler, sondern Stille:
 *
 *     Sabotage-Datei mit `any` + unbenutzter Variable nach lib/ gelegt
 *     → pnpm --filter @craft-codex/tischler lint
 *     → "✔ No ESLint warnings or errors", EXIT 0
 *
 * Das ist exakt der CI-Schritt aus `.github/workflows/ci.yml`. Der Lint-Job
 * meldete also grün, ohne eine einzige Regel anzuwenden — ein Wächter, der
 * nichts prüft, meldet grün.
 *
 * MINIMALER SCHNITT: Die bestehenden Regeln bleiben unverändert, sie werden
 * nur über `FlatCompat` in das neue Format gehoben. Kein Regelwerk-Umbau in
 * derselben Änderung — sonst wäre nicht mehr unterscheidbar, ob ein neuer
 * Befund vom scharfen Wächter oder von einer neuen Regel stammt.
 *
 * ⚠️ WAS DIESE DATEI NICHT LEISTET — nachgemessen, damit es niemand falsch
 * liest: Repariert ist die ANWENDUNG der Regeln, nicht ihr Umfang. Genau die
 * Sabotage-Datei oben (`any` + unbenutzte Variable) kommt hier weiterhin
 * durch, weil `next/core-web-vitals` weder `@typescript-eslint/no-unused-vars`
 * noch `no-explicit-any` setzt — die App hat also weiter KEINE
 * TS-Hygiene-Regeln, anders als `packages/core`, wo beide greifen. Scharf ist
 * der Wächter hier für Next-, React- und a11y-Regeln (belegt: `<img>` ohne
 * alt → Exit 1, vorher Exit 0). Das Nachziehen der TS-Regeln ist ein eigener
 * Schnitt → Issue #36.
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

export default [
  {
    // Generierte und fremde Verzeichnisse gehören nicht zum Prüfstoff.
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'next-env.d.ts'],
  },
  ...compat.extends('next/core-web-vitals'),
];
