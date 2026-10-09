#!/usr/bin/env bash
# Online backup of the TriGuide SQLite database. Safe to run while the API is
# writing: sqlite3's .backup takes a consistent snapshot rather than copying
# bytes out from under an open transaction.
#
# Invoked nightly from jonahhome's crontab; run by hand any time:
#   ./deploy/backup-db.sh
set -euo pipefail

DB="${DB:-/home/jonahhome/projects/triguide/server/data/triguide.db}"
DEST_DIR="${DEST_DIR:-/home/jonahhome/backups/triguide}"
KEEP="${KEEP:-14}"
SQLITE=/usr/bin/sqlite3

stamp="$(date +%Y%m%d-%H%M%S)"
out="${DEST_DIR}/triguide-${stamp}.db"

if [[ ! -f "$DB" ]]; then
  echo "$(date -Is) ERROR: database not found at ${DB}" >&2
  exit 1
fi

mkdir -p "$DEST_DIR"
"$SQLITE" "$DB" ".backup '${out}'"

# Verify the snapshot is readable and structurally sound before trusting it.
if ! "$SQLITE" "$out" "PRAGMA integrity_check;" | grep -qx "ok"; then
  echo "$(date -Is) ERROR: integrity check failed for ${out}; keeping it for inspection" >&2
  exit 1
fi

users="$("$SQLITE" "$out" "SELECT count(*) FROM users;" 2>/dev/null || echo "?")"
size="$(du -h "$out" | cut -f1)"
echo "$(date -Is) ok ${out} (${size}, users=${users})"

# Prune: keep the newest $KEEP nightly snapshots, leave anything else alone.
mapfile -t old < <(ls -1t "${DEST_DIR}"/triguide-*.db 2>/dev/null | tail -n +$((KEEP + 1)))
for f in "${old[@]:-}"; do
  [[ -n "$f" ]] || continue
  rm -f -- "$f"
  echo "$(date -Is) pruned ${f}"
done
