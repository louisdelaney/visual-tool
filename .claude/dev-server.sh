#!/bin/sh
# Runs the site against the backend on the build server (REMOTE_HOST in .env.local):
#
#   sh .claude/dev-server.sh            both steps below, in order
#   sh .claude/dev-server.sh rebuild    copies the working tree to the build server and rebuilds the
#                                       backend there with Node's debugger, then exits
#   sh .claude/dev-server.sh serve      tunnels the debugger to localhost:9229, streams the backend's
#                                       logs and runs the site on localhost:5180
#
# The "Site + backend" launch in .vscode/launch.json runs rebuild on every launch and serve only
# when it isn't running already, because VS Code reuses a running background task: with both
# in one task, the backend kept whatever code was there when the task first started.
set -eu
cd "$(dirname "$0")/.."

mode=${1:-all}
PORT=5180
# From the environment, else .env.local, as scripts/remote.sh reads them.
REMOTE_HOST=${REMOTE_HOST:-$(grep '^REMOTE_HOST=' .env.local 2>/dev/null | tail -n 1 | cut -d= -f2-)}
REMOTE_DIR=${REMOTE_DIR:-$(grep '^REMOTE_DIR=' .env.local 2>/dev/null | tail -n 1 | cut -d= -f2-)}
REMOTE_DIR=${REMOTE_DIR:-'~/visual-tool'}
# Without it, remote.sh would run Docker here and the backend would silently keep old code.
if [ -z "$REMOTE_HOST" ]; then
  echo "dev+server: REMOTE_HOST isn't set, so the backend can't be rebuilt. Is .env.local missing" >&2
  echo "dev+server: (an end-to-end run moves it aside while it runs)?" >&2
  exit 1
fi

if [ "$mode" = rebuild ] || [ "$mode" = all ]; then
  # Keeps allowing the plain dev server on 5173 too, so both sites work against this one backend.
  scripts/remote.sh env ALLOWED_ORIGIN=http://localhost:5173,http://localhost:$PORT \
    docker compose -f compose.yaml -f compose.debug.yaml up -d --build firestore backend
fi
[ "$mode" = rebuild ] && exit 0

# The serve task's beginsPattern in .vscode/tasks.json; nothing else may print it.
echo "dev+server: starting"

# One connection for both: the debugger tunnel, and the backend's logs from now on. The logs
# start again after a rebuild replaces the container, and stop once nothing reads them.
ssh -n -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -L 9229:localhost:9229 "$REMOTE_HOST" \
  "cd $REMOTE_DIR && while docker compose logs -f --no-log-prefix --since 1s backend; do sleep 2; done" &
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
