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
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
{ crontab -l 2>/dev/null || true; } | sed "/$BEGIN/,/$END/d" > "$TMP"
cat >> "$TMP" <<EOF
$BEGIN
PATH=$PATH_VALUE
0 7 * * * cd $ROOT && /usr/bin/flock -n $ROOT/var/ofertas-radar.lock $PNPM_BIN worker >> $LOG_DIR/worker.cron.log 2>&1
$END
EOF
crontab "$TMP"
echo "Cron instalado para Ofertas Radar a las 07:00 (zona horaria del sistema)."
