#!/bin/sh
# Runs the Firestore emulator with its data kept in /data (a Docker volume), for compose.yaml.
#
# The emulator itself only holds data in memory, and its --export-on-exit saves only on a clean
# shutdown. So this script loads the newest snapshot on start, saves a new one every
# SNAPSHOT_SECONDS (default 60) and again when the container is stopped, and keeps the newest
# few. A crash loses at most the last interval.
#
# Each snapshot is written to /data/incoming, flushed to disk, and only then moved into
# /data/snapshots, so a half-written one is never loaded. A sudden power loss or a disk dropping
# off can still leave one whose files are empty (it happened once before the flush was added), so
# on start any snapshot with an empty metadata file is moved to /data/broken, where it's kept for
# a look and doesn't count towards the few kept, and the newest usable one is loaded instead.
set -eu

PROJECT=${PROJECT:-demo-visual-tool}
PORT=8081
INTERVAL=${SNAPSHOT_SECONDS:-60}
KEEP=5
SNAPSHOTS=/data/snapshots
INCOMING=/data/incoming
BROKEN=/data/broken

mkdir -p "$SNAPSHOTS"
rm -rf "$INCOMING"

# Whether a snapshot can be loaded: its overall metadata and every collection's metadata are there
# and not empty. Empty data files are allowed, since an empty database can export them.
usable() {
  [ -s "$1/$(basename "$1").overall_export_metadata" ] || return 1
  for meta in $(find "$1" -name '*.export_metadata'); do
    [ -s "$meta" ] || return 1
  done
}

latest=
for snap in $(ls -1d "$SNAPSHOTS"/firestore_export_* 2>/dev/null | sort -r); do
  if usable "$snap"; then
    latest=$snap
    break
  fi
  echo "firestore-emulator: $snap has an empty metadata file, so it was cut off while saving: moved to $BROKEN" >&2
  mkdir -p "$BROKEN"
  mv "$snap" "$BROKEN"/
done
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
    # On disk before it's moved, and the move on disk before it can be rotated away, so a crash
    # leaves the previous snapshot or this one complete, never a newest one that's empty.
    sync
    mv "$INCOMING"/firestore_export_* "$SNAPSHOTS"/
    sync
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
