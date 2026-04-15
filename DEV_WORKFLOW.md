# Baserow + plugin: fast development loop

Goal: avoid rebuilding the entire stack for every small change.

## 1) Backend-only changes (fastest)

Use when you modify Python files in plugin-backend:

```bash
cd /home/bimbot-ubuntu/apps/baserow-color-field-plugin
bash ./scripts/sync-backend.sh
bash ./scripts/smoke-test.sh
```

This:
- copies the plugin backend into the container
- updates `site-packages`
- restarts only the `baserow` container

No image build required.

## 2) Frontend / plugin UI changes

When you modify Vue/JS in plugin-web-frontend a new frontend bundle is needed.
Run:

```bash
cd /home/bimbot-ubuntu/apps/baserow-color-field-plugin
bash ./scripts/deploy-fast.sh
bash ./scripts/smoke-test.sh
```

This:
- builds only the Baserow plugin image
- recreates only the `baserow` container with the same runtime config
- leaves other containers in the stack untouched

## 3) Standard daily loop

1. Code the change.
2. Choose a deploy track:
   - backend-only: `sync-backend.sh`
   - frontend or mixed: `deploy-fast.sh`
3. Run `smoke-test.sh`.
4. Verify functionality in the UI / API.

## 4) Environment variables (optional)

You can override the default values:

```bash
IMAGE_TAG=baserow-custom:2.1.6-color-field CONTAINER_NAME=baserow bash ./scripts/deploy-fast.sh
CONTAINER_NAME=baserow bash ./scripts/sync-backend.sh
BASE_URL=http://127.0.0.1 bash ./scripts/smoke-test.sh
```

`BASE_URL` is optional. Without it only container health is verified.

## 5) Why this is better

- No `docker compose up --build` for the entire environment.
- Only the `baserow` container is redeployed.
- Backend iteration takes seconds instead of minutes.
