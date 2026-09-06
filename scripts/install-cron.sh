#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT/var/log"
mkdir -p "$LOG_DIR"
NODE_BIN="$(command -v node)"
PNPM_BIN="$(command -v pnpm)"
CODEX_BIN="$(command -v codex || true)"
PATH_VALUE="$(dirname "$NODE_BIN"):$(dirname "$PNPM_BIN"):$(dirname "${CODEX_BIN:-/usr/bin/codex}"):/usr/local/bin:/usr/bin:/bin"
BEGIN="# BEGIN OFERTAS-RADAR"
END="# END OFERTAS-RADAR"
BACKUP_BEGIN="# BEGIN OFERTAS-RADAR BACKUP"
BACKUP_END="# END OFERTAS-RADAR BACKUP"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
{ crontab -l 2>/dev/null || true; } | sed "/$BEGIN/,/$END/d; /$BACKUP_BEGIN/,/$BACKUP_END/d" > "$TMP"
cat >> "$TMP" <<EOF
$BEGIN
PATH=$PATH_VALUE
0 7 * * * cd $ROOT && /usr/bin/flock -n $ROOT/var/ofertas-radar.lock $PNPM_BIN worker >> $LOG_DIR/worker.cron.log 2>&1
$END
$BACKUP_BEGIN
0 0 * * * /usr/bin/flock -n /tmp/ofertas-radar-prisma-postgres-backup.lock $NODE_BIN $ROOT/scripts/backup-prisma-postgres.mjs >> $LOG_DIR/prisma-postgres-backup.log 2>&1
$BACKUP_END
EOF
crontab "$TMP"
echo "Cron instalado para Ofertas Radar: backup a las 00:00 y worker a las 07:00 (zona horaria del sistema)."
