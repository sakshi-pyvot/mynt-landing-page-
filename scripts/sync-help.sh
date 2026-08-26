#!/usr/bin/env bash
# Re-sync Help Centre content from mynt-cfd-frontend (source of truth).
# Usage: scripts/sync-help.sh [path-to-mynt-cfd-frontend]   (default: ../mynt-cfd-frontend)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CFD="${1:-$ROOT/../mynt-cfd-frontend}"
[ -d "$CFD/public/help-articles" ] || { echo "no help-articles at $CFD" >&2; exit 1; }
rsync -a --delete "$CFD/public/help-articles/" "$ROOT/public/help-articles/"
cp "$CFD/src/help/catalog.ts" "$ROOT/src/help/catalog.ts"
node "$ROOT/scripts/build-help-media.mjs"
echo "synced $(find "$ROOT/public/help-articles" -name '*.html' | wc -l | tr -d ' ') articles"
