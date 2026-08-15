/**
 * ESLint flat config für die MIT-Engine — Wächter wieder scharf.
 *
 * WARUM (gemessen 15.08.2026): Unter ESLint 9 wird `.eslintrc.json` nicht mehr
 * gelesen. Hier war der Ausfall sogar LAUT statt still — `eslint src` brach mit
 * "couldn't find an eslint.config.js" ab, also war `pnpm lint` in diesem Paket
 * schlicht nicht ausführbar. Aufgefallen ist es nur, weil der neue Gate-Runner
 * es einmal wirklich aufgerufen hat; die CI ruft ausschließlich das
 * tischler-Lint auf, dieses Paket war dort nie enthalten.
 *
 * Mit toter Config war auch die Open-Core-Grenze auf Lint-Ebene blind
 * (`no-restricted-imports` unten). Gedeckt blieb sie durch
 * `scripts/boundary-check.sh`, das dieselbe Grenze unabhängig prüft und in der
 * CI läuft — zwei Wächter, einer davon war eingeschlafen.
 *
 * MINIMALER SCHNITT: Regeln 1:1 aus der bisherigen `.eslintrc.json`
 * übernommen, nur ins neue Format gehoben.
 */

import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'tests/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // Die alte Config zählte Browser-/Node-/Worker-Globals per `env` auf,
      // damit `no-undef` sie kennt. Statt dafür das `globals`-Paket neu
      // hereinzuholen: `no-undef` aus — für TypeScript-Dateien empfiehlt
      // typescript-eslint das ausdrücklich, weil der Compiler unbekannte
      // Namen ohnehin schärfer meldet (und `pnpm typecheck` läuft in der CI).
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', args: 'none' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Die Open-Core-Grenze: die Engine bleibt frei von Framework-, DB-,
      // Transport- und Auth-Abhängigkeiten. Wortgleich aus der alten Config.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['next', 'next/*', 'react', 'react-dom', 'vue', '@vue/*', 'svelte', '@sveltejs/*'],
              message:
                'Open-core boundary: @craft-codex/core stays framework-agnostic — consumers wire React/Next/etc on their side.',
            },
            {
              group: ['@supabase/*', '@firebase/*', 'firebase-*'],
              message:
                'Open-core boundary: no database / BaaS dependency in the engine. Consumers bring their own persistence.',
            },
            {
              group: ['livekit-*', '@livekit/*', 'daily-co'],
              message:
                'Open-core boundary: live-call transports belong in consumer apps, not in the engine.',
            },
            {
              group: ['@auth0/*', '@clerk/*'],
              message: 'Open-core boundary: no auth provider dependency in the engine.',
            },
          ],
        },
      ],
    },
  },
];
