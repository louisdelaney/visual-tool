#!/bin/sh
# Runs the Firestore emulator with its data kept in /data (a Docker volume), for compose.yaml.
#
# The emulator itself only holds data in memory, and its --export-on-exit saves only on a clean
# shutdown. So this script loads the newest snapshot on start, saves a new one every
# SNAPSHOT_SECONDS (default 60) and again when the container is stopped, and keeps the newest
# few. A crash loses at most the last interval.
#
# Each snapshot is written to /data/incoming and only moved into /data/snapshots once the export
# has finished, so a half-written one is never loaded.
set -eu

PROJECT=${PROJECT:-demo-visual-tool}
PORT=8081
INTERVAL=${SNAPSHOT_SECONDS:-60}
KEEP=5
SNAPSHOTS=/data/snapshots
INCOMING=/data/incoming

mkdir -p "$SNAPSHOTS"
rm -rf "$INCOMING"

latest=$(ls -1d "$SNAPSHOTS"/firestore_export_* 2>/dev/null | sort | tail -n 1 || true)
if [ -n "$latest" ]; then
  echo "firestore-emulator: loading $latest"
  set -- --import-data="$latest/$(basename "$latest").overall_export_metadata"
else
  echo "firestore-emulator: no snapshot yet, starting empty"
  set --
fi

gcloud emulators firestore start --host-port="0.0.0.0:$PORT" --project="$PROJECT" "$@" &
emulator=$!

snapshot() {
  rm -rf "$INCOMING" && mkdir -p "$INCOMING"
  if curl -sf -m 60 -X POST "http://localhost:$PORT/emulator/v1/projects/$PROJECT:export" \
      -H "Content-Type: application/json" \
      -d "{\"database\":\"projects/$PROJECT/databases/(default)\",\"export_directory\":\"$INCOMING\"}" >/dev/null; then
    mv "$INCOMING"/firestore_export_* "$SNAPSHOTS"/
    ls -1d "$SNAPSHOTS"/firestore_export_* | sort | head -n "-$KEEP" | xargs -r rm -rf
  else
    echo "firestore-emulator: snapshot failed" >&2
  fi
}

stop() {
  echo "firestore-emulator: saving a snapshot before stopping"
  snapshot
  kill "$emulator" 2>/dev/null || true
  exit 0
}
trap stop TERM INT

# Wait for the emulator to answer before the first snapshot.
until curl -sf -m 2 "http://localhost:$PORT/" >/dev/null; do sleep 1; done
echo "firestore-emulator: ready, saving a snapshot every ${INTERVAL}s to $SNAPSHOTS"

while kill -0 "$emulator" 2>/dev/null; do
  # sleep in the background and wait, so a stop signal is handled straight away
  sleep "$INTERVAL" & wait $! || true
  snapshot
done
echo "firestore-emulator: the emulator exited" >&2
exit 1
