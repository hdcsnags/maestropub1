#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
SNAPSHOT_DIR_DEFAULT="$ROOT_DIR/.snapshots"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
OUTPUT_PATH=""
INCLUDE_GIT=0
QUIET=0

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Create a repository snapshot archive.

Options:
  -o, --output FILE     Write archive to FILE
  -d, --dir DIR         Snapshot output directory (default: $SNAPSHOT_DIR_DEFAULT)
      --include-git     Include .git directory in snapshot
  -q, --quiet           Suppress non-error output
  -h, --help            Show this help message

Environment:
  SNAPSHOT_NAME         Base name for generated archive (default: repo snapshot name)
EOF
}

log() {
  if [ "$QUIET" -eq 0 ]; then
    printf '%s\n' "$*"
  fi
}

fail() {
  printf 'snapshot: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

sanitize_name() {
  printf '%s' "$1" | tr ' /:' '---' | tr -cd '[:alnum:]_.-'
}

OUTPUT_DIR="$SNAPSHOT_DIR_DEFAULT"

while [ "$#" -gt 0 ]; do
  case "$1" in
    -o|--output)
      [ "$#" -ge 2 ] || fail "missing value for $1"
      OUTPUT_PATH="$2"
      shift 2
      ;;
    -d|--dir)
      [ "$#" -ge 2 ] || fail "missing value for $1"
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --include-git)
      INCLUDE_GIT=1
      shift
      ;;
    -q|--quiet)
      QUIET=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "unknown argument: $1"
      ;;
  esac
done

require_cmd tar
require_cmd date

REPO_NAME=$(basename "$ROOT_DIR")
BASE_NAME=${SNAPSHOT_NAME:-$REPO_NAME}
BASE_NAME=$(sanitize_name "$BASE_NAME")
[ -n "$BASE_NAME" ] || BASE_NAME="snapshot"
ARCHIVE_NAME="${BASE_NAME}-${TIMESTAMP}.tar.gz"

if [ -z "$OUTPUT_PATH" ]; then
  mkdir -p "$OUTPUT_DIR"
  OUTPUT_PATH="$OUTPUT_DIR/$ARCHIVE_NAME"
else
  OUTPUT_PARENT=$(dirname "$OUTPUT_PATH")
  mkdir -p "$OUTPUT_PARENT"
fi

TMP_EXCLUDES=$(mktemp)
cleanup() {
  rm -f "$TMP_EXCLUDES"
}
trap cleanup EXIT INT TERM

cat > "$TMP_EXCLUDES" <<EOF
.git
node_modules
coverage
.dist
build
.tmp
.DS_Store
.snapshots
EOF

if [ "$INCLUDE_GIT" -eq 1 ]; then
  grep -v '^\.git$' "$TMP_EXCLUDES" > "$TMP_EXCLUDES.tmp" && mv "$TMP_EXCLUDES.tmp" "$TMP_EXCLUDES"
fi

if [ -f "$ROOT_DIR/.snapshotignore" ]; then
  cat "$ROOT_DIR/.snapshotignore" >> "$TMP_EXCLUDES"
fi

log "Creating snapshot: $OUTPUT_PATH"

(
  cd "$ROOT_DIR"
  tar \
    --exclude-from "$TMP_EXCLUDES" \
    -czf "$OUTPUT_PATH" \
    .
)

SIZE=$(wc -c < "$OUTPUT_PATH" | tr -d ' ')
log "Snapshot created (${SIZE} bytes)"
