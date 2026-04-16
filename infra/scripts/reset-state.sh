#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

usage() {
  cat <<'EOF'
Usage: reset-state.sh [options]

Resets local infrastructure state for the repository by removing common cache,
PID, lock, log, and data directories used by development tooling.

Options:
  --dry-run     Show what would be removed without deleting anything
  -h, --help    Show this help message
EOF
}

DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

log() {
  printf '[reset-state] %s\n' "$*"
}

remove_path() {
  local target="$1"

  if [[ ! -e "$target" && ! -L "$target" ]]; then
    return 0
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "would remove ${target}"
    return 0
  fi

  rm -rf -- "$target"
  log "removed ${target}"
}

find_and_remove_by_name() {
  local root="$1"
  shift
  local name

  for name in "$@"; do
    while IFS= read -r -d '' match; do
      remove_path "$match"
    done < <(find "$root" -mindepth 1 \( -type d -o -type f -o -type l \) -name "$name" -print0 2>/dev/null)
  done
}

log "repository root: ${REPO_ROOT}"

EXACT_PATHS=(
  "${REPO_ROOT}/.terraform"
  "${REPO_ROOT}/.terragrunt-cache"
  "${REPO_ROOT}/.cache"
  "${REPO_ROOT}/tmp"
  "${REPO_ROOT}/logs"
  "${REPO_ROOT}/.pids"
  "${REPO_ROOT}/.state"
  "${REPO_ROOT}/infra/.terraform"
  "${REPO_ROOT}/infra/.terragrunt-cache"
  "${REPO_ROOT}/infra/tmp"
  "${REPO_ROOT}/infra/logs"
  "${REPO_ROOT}/infra/.state"
)

for path in "${EXACT_PATHS[@]}"; do
  remove_path "$path"
done

find_and_remove_by_name "$REPO_ROOT" \
  '.terraform' \
  '.terragrunt-cache' \
  '.DS_Store' \
  '*.pid' \
  '*.pid.lock' \
  '*.log' \
  '*.tmp'

if [[ "$DRY_RUN" -eq 1 ]]; then
  log "dry run complete"
else
  log "state reset complete"
fi
