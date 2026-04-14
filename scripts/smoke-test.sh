#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-baserow}"
BASE_URL="${BASE_URL:-}"

status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$CONTAINER_NAME")"
echo "Container health: $status"

if [[ "$status" != "healthy" && "$status" != "running" ]]; then
  echo "Container is not healthy/running." >&2
  exit 1
fi

if [[ -n "$BASE_URL" ]]; then
  echo "Checking HTTP endpoint: $BASE_URL"
  http_code="$(curl -k -s -o /dev/null -w '%{http_code}' "$BASE_URL")"
  echo "HTTP status: $http_code"
  if [[ "$http_code" -lt 200 || "$http_code" -gt 399 ]]; then
    echo "Unexpected HTTP status: $http_code" >&2
    exit 1
  fi
fi

echo "Smoke test OK."
