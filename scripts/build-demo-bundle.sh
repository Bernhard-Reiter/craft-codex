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

echo "▸ Werkstoff-Bundle: das Modell im Auftrag muss die Datei im Bundle sein (sonst zeigt die Seite 404 statt Möbel) — VOR den Tests: eigenes Schloss, nicht das zweite an derselben Tür"
WB="$ROOT/apps/tischler/public/werkstoff-bundle"
# R49-1: die Vorbedingung darf nicht fail-open sein — ohne auftrag.json gibt es kein Möbel, also Abbruch.
[ -f "$WB/auftrag.json" ] || { echo "✗ $WB/auftrag.json fehlt — kein Auftrag, kein Werkstoff-Bundle auf dem Stick"; exit 1; }
if grep -q '"modell"' "$WB/auftrag.json"; then
  SOLL=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['modell']['glb_sha256'])" "$WB/auftrag.json")
  DATEI=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['modell']['datei'])" "$WB/auftrag.json")
  [ -f "$WB/$DATEI" ] || { echo "✗ auftrag.json nennt $DATEI, die Datei fehlt im Bundle"; exit 1; }
  IST=$(shasum -a 256 "$WB/$DATEI" | cut -d' ' -f1)
  [ "$IST" = "$SOLL" ] || { echo "✗ $DATEI hat Hash $IST, der Auftrag nennt $SOLL — anderes Erzeugnis"; exit 1; }
  echo "  ✓ $DATEI = $SOLL"
else
  echo "  ⚠ auftrag.json nennt kein Modell — die Seite zeigt Karten, aber keine Szene (gemeldet, kein Abbruch)"
fi

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
