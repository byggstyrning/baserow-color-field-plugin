---
name: baserow-plugin-dev-loop
description: >-
  Guides the full development cycle for the Baserow color field plugin —
  choosing the right deploy track, running smoke tests, and iterating.
  Use when modifying the plugin, adding a field type, debugging container
  issues, deploying changes, or asking about the dev workflow, deploy-fast,
  sync-backend, or smoke-test.
---

# Baserow color field plugin — development loop

## Architecture overview

The plugin has two layers built into a single all-in-one Baserow Docker image:

```
Dockerfile (multi-stage)
├── Stage 1: frontend-builder (node:24-trixie-slim)
│   ├── Clones Baserow ${BASEROW_VERSION} source
│   ├── Copies web-frontend/ plugin into the Baserow tree
│   ├── yarn install + yarn add vue-accessible-color-picker colorjs.io
│   ├── node scripts/patch-vue-accessible-color-picker.js (sliders-only picker in bundle)
│   └── yarn run build → .output/
└── Stage 2: runtime (baserow/baserow:${BASEROW_VERSION})
    ├── Copies .output/ (frontend bundle)
    └── Copies backend Python package into site-packages
```

**Backend:** Python/Django package at `plugins/baserow_color_field/backend/`. Registered via `apps.py` → `plugin_registry` + `field_type_registry`.

**Frontend:** Nuxt/Vue module at `plugins/baserow_color_field/web-frontend/`. Loaded via `module.js` → `plugin.js` → registers `ColorFieldType` on `$registry`.

## Deploy decision tree

```
  ┌─ What did you change? ─────────────────────────────────┐
  │                                                         │
  │  Only Python files         Vue/JS files, Dockerfile,   │
  │  under backend/?           or changes spanning both?    │
  │       │                            │                    │
  │       ▼                            ▼                    │
  │  sync-backend.sh           deploy-fast.sh               │
  │  (seconds)                 (minutes — rebuilds image)   │
  │       │                            │                    │
  │       └────────────┬───────────────┘                    │
  │                    ▼                                    │
  │             smoke-test.sh                               │
  └─────────────────────────────────────────────────────────┘
```

## Commands

All commands run from the project root: `/home/bimbot-ubuntu/apps/baserow-color-field-plugin`

### Backend-only (fastest)

```bash
bash ./scripts/sync-backend.sh
bash ./scripts/smoke-test.sh
```

Copies Python source into the running container (plugin path + site-packages) and restarts it. No image rebuild.

### Frontend or mixed

```bash
bash ./scripts/deploy-fast.sh
bash ./scripts/smoke-test.sh
```

Builds a new Docker image with the updated frontend bundle, then recreates the container preserving runtime config (volumes, ports, env, network).

### Environment variable overrides

| Variable | Default | Script |
|----------|---------|--------|
| `IMAGE_TAG` | `baserow-custom:2.1.6-color-field` | `deploy-fast.sh` |
| `CONTAINER_NAME` | `baserow` | all |
| `BASEROW_VERSION` | `2.1.6` | `deploy-fast.sh` |
| `BASE_URL` | *(empty)* | `smoke-test.sh` |

Example with overrides:

```bash
IMAGE_TAG=baserow-custom:latest BASEROW_VERSION=2.1.6 bash ./scripts/deploy-fast.sh
BASE_URL=http://127.0.0.1 bash ./scripts/smoke-test.sh
```

## Troubleshooting

### Container not healthy after deploy

1. Check logs: `docker logs baserow --tail 100`
2. Inspect health status: `docker inspect -f '{{json .State.Health}}' baserow | python3 -m json.tool`
3. The health check poll in `deploy-fast.sh` waits up to 120 s. If the container needs more time (first-run migrations), wait manually.

### Backend changes not taking effect after sync

`sync-backend.sh` copies to **two** paths inside the container:
- `/baserow/data/plugins/baserow_color_field/backend/src/baserow_color_field`
- `/baserow/venv/lib/python3.14/site-packages/baserow_color_field`

If only one was updated (e.g. script was interrupted), re-run the full script.

### Frontend bundle not updating

- `deploy-fast.sh` rebuilds the entire image. If changes are not visible, hard-refresh the browser (`Ctrl+Shift+R`).
- Verify the new image was used: `docker inspect baserow --format '{{.Config.Image}}'`
- Check that `ADDITIONAL_MODULES` in the Dockerfile points to the correct `module.js` path.

### Cursor Debug Mode / NDJSON ingest from the browser

Workspace rule: `apps/.cursor/rules/cursor_debug_mode_browser.mdc`.

The plugin does **not** ship Cursor ingest calls; opt-in logging uses `colorFieldDebug` in `utils/colorFieldDebug.js` when you add temporary traces.

**Summary:** `fetch` to `http://127.0.0.1:…/ingest/…` only works when the page runs on the same machine as the Cursor debug ingest. Testing Baserow on a **remote HTTPS host** will not write NDJSON to the agent’s workspace log and may spam the console with failed POSTs. Use code-path analysis, local same-origin testing, or `console.*` traces the user can paste.

### Python import errors in the container

- Confirm Python version matches: `docker exec baserow python3 --version` (expected: 3.14.x).
- Confirm the package exists: `docker exec baserow ls /baserow/venv/lib/python3.14/site-packages/baserow_color_field/`

## Related files

- `DEV_WORKFLOW.md` — concise quick-reference for the daily loop
- `README.md` — project overview, Docker quick start, hex format docs
