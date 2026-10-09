#!/bin/sh
set -eu
# Run from the repository root; no credentials are printed or embedded in arguments.
: "${1:?Usage: backend/scripts/backup.sh /absolute/path/to/new-backup.dump}"
case "$1" in /*) ;; *) echo "Use an absolute backup path" >&2; exit 2 ;; esac
umask 077
# Never overwrite an existing backup. Remove an incomplete dump if the command fails.
(set -C; : > "$1")
if ! docker compose exec -T postgres pg_dump -U aspa -d aspa --format=custom > "$1"; then
    rm -f "$1"
    exit 1
fi
