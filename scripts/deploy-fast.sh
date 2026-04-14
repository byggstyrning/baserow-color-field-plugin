#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE_TAG="${IMAGE_TAG:-baserow-custom:2.1.6-color-field}"
CONTAINER_NAME="${CONTAINER_NAME:-baserow}"
BASEROW_VERSION="${BASEROW_VERSION:-2.1.6}"

cd "$ROOT_DIR"

echo "[1/3] Building image $IMAGE_TAG (BASEROW_VERSION=$BASEROW_VERSION)..."
docker build \
  --build-arg BASEROW_VERSION="$BASEROW_VERSION" \
  -t "$IMAGE_TAG" \
  .

echo "[2/3] Recreating container $CONTAINER_NAME from latest image..."
python3 scripts/recreate_container.py \
  --container "$CONTAINER_NAME" \
  --image "$IMAGE_TAG"

echo "[3/3] Waiting for container health..."
for _ in $(seq 1 60); do
  status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$CONTAINER_NAME" 2>/dev/null || true)"
  if [[ "$status" == "healthy" || "$status" == "running" ]]; then
    echo "Container status: $status"
    exit 0
  fi
  sleep 2
done

echo "Container did not become healthy in time." >&2
exit 1
