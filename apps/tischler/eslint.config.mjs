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
 * Der TS-Block unten zieht beide Regeln nach, wortgleich wie in
 * `packages/core`: unbenutzte Variablen/Importe = Fehler (Ausnahme: Name
 * beginnt mit `_`; Funktionsargumente werden nicht geprüft), `any` = Warnung.
 * `lint` läuft mit `--max-warnings 0`: eine Warnung (`any`) bricht die CI
 * also genauso wie ein Fehler.
 * Bewacht von `lib/lint-waechter.test.ts` (prüft über die ESLint-API die
 * Regeln in app/, components/, lib/ und in den Dateien außerhalb davon,
 * dazu das `lint`-Kommando selbst).
 *
 * ABDECKUNG (#64): `lint` = ESLint-CLI über die ganze App (`eslint .`); nur
 * die `ignores` im ersten Block unten sind ausgenommen. Vorher lief
 * `next lint`, das nur app/, components/ und lib/ las.
 * Welche Regel wo greift: Die Next-Regeln gelten für alle Dateien. Unbenutzte
 * Variablen sind überall ein Fehler, in .ts/.tsx über
 * `@typescript-eslint/no-unused-vars`, in .js/.mjs/.cjs (scripts/,
 * next.config.mjs, diese Datei) über das Kern-`no-unused-vars` mit denselben
 * Optionen. `any` gibt es nur in TypeScript, deshalb steht `no-explicit-any`
 * nur im TS-Block.
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    // Generierte und fremde Verzeichnisse gehören nicht zum Prüfstoff.
    // ESLint 9 liest `.gitignore` nicht — die Ausgabe-Ordner aus der
    // Root-`.gitignore` stehen deshalb ausdrücklich hier (sonst lintet
    // `eslint .` lokal auch ungetrackte Build-Ausgaben).
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      'next-env.d.ts',
      '.turbo/**',
      'dist/**',
      'out/**',
      'coverage/**',
      'test-results/**',
      '.vercel/**',
    ],
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
      // warn reicht: lint läuft mit --max-warnings 0, any bricht die CI wie ein Fehler.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // #64 (Review S1): `eslint .` lintet auch die JS-Dateien. Ohne diesen Block
    // bekämen sie keine Prüfung auf unbenutzte Variablen (next/core-web-vitals setzt sie nicht).
    // Optionen wie der TS-Block oben; W6c prüft davon: Fehler, `^_` frei.
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', args: 'none' },
      ],
    },
  },
];

export default config;
