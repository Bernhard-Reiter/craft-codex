#!/usr/bin/env bash
# Open-Core Boundary Check (CI Pflicht)
# Verhindert dass VOAI-Pro Code in lehrlings-core landet.
# Nur ECHTE Imports werden geprüft — Kommentare/Doku duerfen Pfade nennen.
# Siehe: docs/PHASE-PLAN.md Sektion 2

set -e

PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$PKG_DIR/src"

# Forbidden Modules (regex pattern fuer import-statements)
FORBIDDEN=(
  "@voai/admin"
  "@voai/pro"
  "voai-pro"
  "@supabase/"
  "livekit-"
  "@livekit/"
)

violations=0

for pattern in "${FORBIDDEN[@]}"; do
  # Match import/from/require with this pattern (real imports, not comments)
  matches=$(grep -rEn --include="*.ts" --include="*.tsx" \
    "(^|[[:space:]])(import|from|require\()[^/]*['\"\`][^'\"\`]*${pattern}" \
    "$SRC" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo "❌ Boundary violation in real import: '$pattern'"
    echo "$matches"
    violations=$((violations + 1))
  fi
done

# Next.js: nur als import erlauben blockieren, nicht in Doku
nextimports=$(grep -rEn --include="*.ts" --include="*.tsx" \
  "(^|[[:space:]])(import|from)[[:space:]]+.*['\"\`]next(/[^'\"\`]+)?['\"\`]" \
  "$SRC" 2>/dev/null || true)
if [ -n "$nextimports" ]; then
  echo "❌ Boundary violation: Next.js import found"
  echo "$nextimports"
  violations=$((violations + 1))
fi

# admin-web als Pfad in echten imports
adminimports=$(grep -rEn --include="*.ts" --include="*.tsx" \
  "(import|from|require)[[:space:]]*.['\"\`][^'\"\`]*admin-web[^'\"\`]*['\"\`]" \
  "$SRC" 2>/dev/null || true)
if [ -n "$adminimports" ]; then
  echo "❌ Boundary violation: admin-web import found"
  echo "$adminimports"
  violations=$((violations + 1))
fi

if [ $violations -gt 0 ]; then
  echo ""
  echo "❌ $violations boundary violation(s) found."
  echo "   lehrlings-core MUSS framework-agnostisch + ohne VOAI-Pro-Deps bleiben."
  exit 1
fi

echo "✅ Open-Core boundary clean (only real imports checked)"
