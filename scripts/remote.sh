#!/usr/bin/env bash
# Runs a command either here or on a remote build machine.
#
#   scripts/remote.sh docker compose up -d --build firestore backend
#
# If REMOTE_HOST is empty, the command just runs locally. If it is set (an ssh destination such
# as user@host), the repository is copied there with rsync (skipping node_modules, build output,
# data, secrets and Terraform state) and the command runs in it over ssh, so Docker need not be
# installed on this machine. REMOTE_HOST and REMOTE_DIR (default ~/visual-tool) come from the
# environment, or from .env.local in the repository root. The exit code is the command's.
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

# Reads NAME from the environment, else from .env.local, else prints the default.
setting() {
  local name=$1 default=${2:-} value=${!1:-}
  if [ -z "$value" ] && [ -f "$root/.env.local" ]; then
    value=$(grep "^${name}=" "$root/.env.local" | tail -n 1 | cut -d= -f2- || true)
    value=${value%\"}; value=${value#\"}
    value=${value%\'}; value=${value#\'}
  fi
  printf '%s' "${value:-$default}"
}

REMOTE_HOST=$(setting REMOTE_HOST)
REMOTE_DIR=$(setting REMOTE_DIR '~/visual-tool')

if [ -z "$REMOTE_HOST" ]; then
  exec "$@"
fi

echo "→ running on $REMOTE_HOST" >&2

rsync -az --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude data \
  --exclude tests/output \
  --exclude .git \
  --exclude .terraform \
  --exclude '*.tfstate*' \
  --exclude '*.tfvars' \
  --exclude .env.local \
  "$root/" "$REMOTE_HOST:$REMOTE_DIR/"

# $REMOTE_DIR is left unquoted-by-us on purpose so that a leading ~ expands on the remote side.
exec ssh -t "$REMOTE_HOST" "cd $REMOTE_DIR && $(printf '%q ' "$@")"
