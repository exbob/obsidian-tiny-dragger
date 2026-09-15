#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

usage() {
  printf '用法: %s [clean]\n' "$0" >&2
  exit 2
}

if [[ "${1:-}" == "clean" ]]; then
  if [[ $# -ne 1 ]]; then
    usage
  fi
  rm -f main.js main.js.map
  rm -rf tiny-dragger
  exit 0
fi

if [[ $# -ne 0 ]]; then
  usage
fi

npm run build

STAGING_DIR="$(mktemp -d "$ROOT_DIR/tiny-dragger.staging.XXXXXX")"
BACKUP_DIR=""
published=0

cleanup() {
  if [[ "$published" -eq 0 ]]; then
    rm -rf "$STAGING_DIR"
    if [[ -n "$BACKUP_DIR" && -e "$BACKUP_DIR" && ! -e tiny-dragger ]]; then
      mv "$BACKUP_DIR" tiny-dragger || true
    fi
  else
    if [[ -n "$BACKUP_DIR" && -e "$BACKUP_DIR" ]]; then
      rm -rf "$BACKUP_DIR"
    fi
  fi
}
trap cleanup EXIT

cp main.js manifest.json styles.css "$STAGING_DIR/"

if [[ -e tiny-dragger ]]; then
  BACKUP_DIR="$(mktemp -d "$ROOT_DIR/tiny-dragger.backup.XXXXXX")"
  rmdir "$BACKUP_DIR"
  mv tiny-dragger "$BACKUP_DIR"
fi

mv "$STAGING_DIR" tiny-dragger
published=1

trap - EXIT
if [[ -n "$BACKUP_DIR" ]]; then
  rm -rf "$BACKUP_DIR"
fi
printf 'Tiny Dragger 发布文件已写入 ./tiny-dragger/\n'
