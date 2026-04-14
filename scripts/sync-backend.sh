#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONTAINER_NAME="${CONTAINER_NAME:-baserow}"

SRC_DIR="$ROOT_DIR/plugins/baserow_color_field/backend/src/baserow_color_field"
TARGET_PLUGIN_DIR="/baserow/data/plugins/baserow_color_field/backend/src/baserow_color_field"
TARGET_SITEPKG_DIR="/baserow/venv/lib/python3.14/site-packages/baserow_color_field"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Source directory not found: $SRC_DIR" >&2
  exit 1
fi

echo "[1/4] Ensuring plugin paths exist in container..."
docker exec "$CONTAINER_NAME" mkdir -p "$TARGET_PLUGIN_DIR" "$TARGET_SITEPKG_DIR"

echo "[2/4] Copying backend source into plugin path..."
docker cp "$SRC_DIR/." "$CONTAINER_NAME:$TARGET_PLUGIN_DIR/"

echo "[3/4] Copying backend source into python site-packages..."
docker cp "$SRC_DIR/." "$CONTAINER_NAME:$TARGET_SITEPKG_DIR/"

echo "[4/4] Restarting container..."
docker restart "$CONTAINER_NAME" >/dev/null
echo "Backend sync complete."
