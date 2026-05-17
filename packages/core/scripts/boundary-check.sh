#!/usr/bin/env bash
# Open-Core Boundary Check (CI gate)
# Ensures @craft-codex/core stays framework-agnostic and free of
# database / auth / proprietary imports. Only REAL imports are
# checked — comments and doc strings may reference any path.
# See: docs/PHASE-PLAN.md

set -e

PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$PKG_DIR/src"

# Forbidden module patterns. Keep this list small + obvious — the
# point is "engine has no DB / auth / framework dependency", not
# "blocklist every package on npm".
FORBIDDEN=(
  "@supabase/"
  "@firebase/"
  "firebase-"
  "livekit-"
  "@livekit/"
  "daily-co"
  "@auth0/"
  "@clerk/"
)

violations=0

for pattern in "${FORBIDDEN[@]}"; do
  # Match import / from / require statements only (skip comments).
  matches=$(grep -rEn --include="*.ts" --include="*.tsx" \
    "(^|[[:space:]])(import|from|require\()[^/]*['\"\`][^'\"\`]*${pattern}" \
    "$SRC" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo "❌ Boundary violation in real import: '$pattern'"
    echo "$matches"
    violations=$((violations + 1))
  fi
done

# No framework imports (Next.js / React / Vue / Svelte).
fw_pattern="(import|from)[[:space:]]+.*['\"\`](next|@next/|react|react-dom|vue|@vue/|svelte|@sveltejs/)"
fwimports=$(grep -rEn --include="*.ts" --include="*.tsx" \
  "(^|[[:space:]])${fw_pattern}" \
  "$SRC" 2>/dev/null || true)
if [ -n "$fwimports" ]; then
  echo "❌ Boundary violation: framework import found"
  echo "$fwimports"
  violations=$((violations + 1))
fi

if [ $violations -gt 0 ]; then
  echo ""
  echo "❌ $violations boundary violation(s) found."
  echo "   @craft-codex/core MUST stay framework-agnostic + DB-free."
  exit 1
fi

echo "✅ Open-Core boundary clean (only real imports checked)"
