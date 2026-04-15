# Baserow Color Field

A native **Color** field type for [Baserow](https://baserow.io).
Pick, paste, sort, filter — hex colors as first-class data.

[![Deploy](https://img.shields.io/badge/deploy-2_commands-22c55e?style=flat-square)](#quick-start)
![Baserow 2.1.0+](https://img.shields.io/badge/baserow-%E2%89%A5_2.1.0-4338ca?style=flat-square)
![MIT](https://img.shields.io/badge/license-MIT-gray?style=flat-square)

---

## What you get

| Grid view | Row editor |
|:---------:|:----------:|
| Inline swatch + hex input | Swatch and chip show hex; popup is **sliders only** (2D area + hue + alpha) |

- **Hex storage** — `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`, auto-normalized
- **Color picker** — `vue-accessible-color-picker` with a **Docker build patch** that strips the library’s text/format row so the shipped UI is visual only. You type or paste hex in the **grid cell** or **row chip**; the popup is for picking, not editing hex strings.
- **Copy & paste** — paste any valid hex string, invalid values are silently rejected
- **Sort & filter** — works with Baserow's built-in sort and contains-filter
- **API ready** — read/write hex strings via the Baserow REST API, upsert supported
- **Zero config** — no settings on the field, just create and use

---

<img width="299" height="364" alt="Grid: swatch and hex in the cell" src="https://github.com/user-attachments/assets/5377ff51-7b62-4e64-b3b2-acabea45fcd9" />
<img width="168" height="242" alt="Row modal: chip + sliders-only picker" src="https://github.com/user-attachments/assets/215c3588-8820-4bd0-a110-a3bd2b61aa93" />

## Quick start

### Option A: Docker (recommended)

Build and run Baserow with the plugin baked in:

```bash
git clone https://github.com/byggstyrning/baserow-color-field-plugin.git
cd baserow-color-field-plugin

docker build -t baserow-color:latest .
docker run -d --name baserow -p 80:80 -p 443:443 \
  -v baserow_data:/baserow/data \
  baserow-color:latest
```

Open **http://localhost** — create a table, add a **Color** field, done.

### Option B: Add to an existing Baserow image

```dockerfile
FROM baserow/baserow:2.1.6

# Install backend
COPY plugins/baserow_color_field /baserow/data/plugins/baserow_color_field
RUN /baserow/plugins/install_plugin.sh --folder /baserow/data/plugins/baserow_color_field
```

> The frontend must also be rebuilt — see the full [Dockerfile](Dockerfile) for the multi-stage build that handles both backend and frontend.

---

## Hex format reference

| Input | Stored as | Notes |
|-------|-----------|-------|
| `#F00` | `#FF0000` | 3-digit shorthand expanded |
| `#F00A` | `#FF0000AA` | 4-digit shorthand expanded |
| `#FF5733` | `#FF5733` | Standard 6-digit hex |
| `#FF573380` | `#FF573380` | 8-digit with alpha channel |
| *(empty)* | `""` | Blank values are valid |

All values are uppercased and validated server-side.

---

## Development

Two fast-iteration paths so you never rebuild the world:

```
Backend only (seconds)          Frontend / mixed (minutes)
─────────────────────           ──────────────────────────
scripts/sync-backend.sh         scripts/deploy-fast.sh
  ↓ docker cp + restart            ↓ docker build + recreate
scripts/smoke-test.sh           scripts/smoke-test.sh
```

```bash
# Backend hot-reload
bash scripts/sync-backend.sh && bash scripts/smoke-test.sh

# Full rebuild (frontend changes)
bash scripts/deploy-fast.sh && bash scripts/smoke-test.sh
```

Override defaults with env vars:

| Variable | Default | Used by |
|----------|---------|---------|
| `IMAGE_TAG` | `baserow-custom:2.1.6-color-field` | `deploy-fast.sh` |
| `CONTAINER_NAME` | `baserow` | all scripts |
| `BASE_URL` | *(none)* | `smoke-test.sh` (HTTP check) |
| `BASEROW_VERSION` | `2.1.6` | `deploy-fast.sh`, `Dockerfile` |

See [DEV_WORKFLOW.md](DEV_WORKFLOW.md) for the full development guide.

---

## Project structure

```
├── Dockerfile                          # Multi-stage: frontend build + final image
├── plugins/baserow_color_field/
│   ├── backend/src/baserow_color_field/
│   │   ├── field_types.py              # ColorFieldType (validation, normalization)
│   │   ├── models.py                   # ColorField model
│   │   └── plugins.py                  # Plugin registration
│   └── web-frontend/
│       ├── components/
│       │   ├── GridViewFieldColor.vue   # Inline grid editing
│       │   ├── RowEditFieldColor.vue    # Row modal editor
│       │   ├── ColorPickerPopup.vue     # Picker widget
│       │   └── ...
│       ├── fieldTypes.js               # FieldType registration
│       └── module.js                   # Nuxt module entry
└── scripts/                            # Deploy, smoke-test, patch-vue-accessible-color-picker.js (VACP dist edit at image build)
```

---

## Compatibility

| Plugin version | Baserow version | Python | Node (build only) |
|:--------------:|:---------------:|:------:|:------------------:|
| 1.0.0 | >= 2.1.0 | 3.14 | 24 |

---

## License

[MIT](https://opensource.org/licenses/MIT) — Byggstyrning
