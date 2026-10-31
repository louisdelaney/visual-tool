#!/bin/sh
# For .claude/launch.json ("dev+server"): starts the backend on the build server with Node's
# debugger, tunnels the debugger to localhost:9229 and streams the backend's logs, then runs the
# site on localhost:5180. Needs REMOTE_HOST in .env.local.
set -eu
cd "$(dirname "$0")/.."

PORT=5180
REMOTE_HOST=$(grep '^REMOTE_HOST=' .env.local | tail -n 1 | cut -d= -f2-)
REMOTE_DIR=$(grep '^REMOTE_DIR=' .env.local | tail -n 1 | cut -d= -f2- || true)
REMOTE_DIR=${REMOTE_DIR:-'~/visual-tool'}

# Keeps allowing the plain dev server on 5173 too, so both sites work against this one backend.
scripts/remote.sh env ALLOWED_ORIGIN=http://localhost:5173,http://localhost:$PORT \
  docker compose -f compose.yaml -f compose.debug.yaml up -d --build firestore backend

# One connection for both: the debugger tunnel, and the backend's logs from now on.
ssh -n -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -L 9229:localhost:9229 "$REMOTE_HOST" \
  "cd $REMOTE_DIR && docker compose logs -f --no-log-prefix --since 1s backend" &
tunnel=$!
trap 'kill $tunnel 2>/dev/null' EXIT INT TERM

npm run dev -- --port "$PORT" --strictPort
