#!/usr/bin/env bash
#
# USB-Notfall-Stick für die Lienz-Demo (docs/DEMO-LIENZ.md §5).
# Baut alles frisch und packt ein lauffähiges Offline-Bundle:
# Repo + node_modules + production build + Anleitung.
#
# Auf dem Zielrechner: entpacken → cd apps/tischler → npx next start -p 3000
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist-demo"
STAMP="$(date +%Y-%m-%d)"
TARBALL="$OUT/craft-codex-demo-$STAMP.tar.gz"

cd "$ROOT"

echo "▸ deps + engine build"
pnpm install --prefer-offline
pnpm --filter @craft-codex/core build

echo "▸ tests (Abbruch bei rot — kein kaputtes Bundle auf den Stick)"
pnpm test

echo "▸ production build"
(cd apps/tischler && pnpm build)

if [ ! -s "$ROOT/apps/tischler/public/tts-cache/manifest.json" ] \
   || grep -q '"entries": *{}' "$ROOT/apps/tischler/public/tts-cache/manifest.json" 2>/dev/null; then
  echo "⚠️  TTS-Cache ist leer — die Demo wird OHNE Stimme sprechen."
  echo "   Befüllen: ELEVENLABS_API_KEY=... pnpm --filter @craft-codex/tischler tts:cache && erneut bundlen."
fi

echo "▸ packe Bundle (inkl. node_modules — Stick-Größe egal, Offline zählt)"
mkdir -p "$OUT"
tar -czf "$TARBALL" \
  --exclude='.git' \
  --exclude='dist-demo' \
  -C "$ROOT/.." "$(basename "$ROOT")"

echo "✓ $TARBALL ($(du -h "$TARBALL" | cut -f1))"
echo "  Zielrechner: tar -xzf <datei> && cd craft-codex/apps/tischler && npx next start -p 3000"
