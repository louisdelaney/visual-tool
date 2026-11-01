#!/bin/sh
# For the "dev+server" task in .vscode/tasks.json: starts the backend on the build server with Node's
# debugger, tunnels the debugger to localhost:9229 and streams the backend's logs, then runs the
# site on localhost:5180. Needs REMOTE_HOST in .env.local.
set -eu
cd "$(dirname "$0")/.."

# The task's beginsPattern in .vscode/tasks.json; nothing else may print it.
echo "dev+server: starting"

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
trap 'kill $tunnel 2>/dev/null' EXIT
# HUP too: closing the task's terminal sends it, and the tunnel and site must not outlive it.
trap 'exit 0' HUP INT TERM

# Vite's "ready" line is what VS Code waits for before attaching, so the tunnel must be up first.
for _ in $(seq 30); do nc -z localhost 9229 2>/dev/null && break; sleep 1; done

# In the background with a wait, so a stop signal is handled now rather than when Vite exits.
node_modules/.bin/vite --port "$PORT" --strictPort &
site=$!
trap 'kill $tunnel $site 2>/dev/null' EXIT
wait $site
