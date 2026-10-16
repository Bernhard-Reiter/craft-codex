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
 * TS-HYGIENE (#36, eigener Schnitt nach der Brücke): `next/core-web-vitals`
 * setzt weder `@typescript-eslint/no-unused-vars` noch `no-explicit-any` —
 * die Sabotage-Datei oben kam deshalb anfangs trotz scharfem Wächter durch.
 * Der letzte Block unten zieht beide Regeln nach, wortgleich wie in
 * `packages/core`: unbenutzte Variablen/Importe = Fehler (Ausnahme: Name
 * beginnt mit `_`; Funktionsargumente werden nicht geprüft), `any` = Warnung.
 * Bewacht von `lib/lint-waechter.test.ts` (prüft die Regeln über die
 * ESLint-API an app/, components/ und lib/).
 *
 * ⚠️ GRENZE: `i18n/` und `scripts/` liegen außerhalb dessen, was der
 * CI-Lint-Schritt (`next lint`) prüft — dort greifen die Regeln nicht.
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

export default [
  {
    // Generierte und fremde Verzeichnisse gehören nicht zum Prüfstoff.
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'next-env.d.ts'],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    // #36: dieselben zwei TS-Hygiene-Regeln wie packages/core (Vorbild dort).
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { parser: tsParser },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', args: 'none' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
