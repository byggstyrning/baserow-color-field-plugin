# Baserow + plugin: snabb utvecklingsloop

Mål: slippa rebuilda hela stacken för varje liten ändring.

## 1) Backend-only ändringar (snabbast)

Använd när du ändrar Python-filer i plugin-backend:

```bash
cd /home/bimbot-ubuntu/apps/baserow-color-field-plugin
bash ./scripts/sync-backend.sh
bash ./scripts/smoke-test.sh
```

Detta:
- kopierar plugin-backend till containern
- uppdaterar `site-packages`
- restartar endast `baserow`

Ingen image-build krävs.

## 2) Frontend/plugin UI ändringar

När du ändrar Vue/JS i plugin-web-frontend krävs ny frontend-bundle.
Kör:

```bash
cd /home/bimbot-ubuntu/apps/baserow-color-field-plugin
bash ./scripts/deploy-fast.sh
bash ./scripts/smoke-test.sh
```

Detta:
- bygger endast Baserow-plugin-imagen
- återskapar endast `baserow`-containern med samma runtime-config
- rör inte övriga containers i er stack

## 3) Standardiserad daglig loop

1. Koda ändring.
2. Välj deploy-spår:
   - backend-only: `sync-backend.sh`
   - frontend eller mixed: `deploy-fast.sh`
3. Kör `smoke-test.sh`.
4. Verifiera funktion i UI/API.

## 4) Miljövariabler (valfritt)

Du kan overridea default-värden:

```bash
IMAGE_TAG=baserow-custom:2.1.6-color-field CONTAINER_NAME=baserow bash ./scripts/deploy-fast.sh
CONTAINER_NAME=baserow bash ./scripts/sync-backend.sh
BASE_URL=http://127.0.0.1 bash ./scripts/smoke-test.sh
```

`BASE_URL` är valfri. Utan den verifieras endast container health.

## 5) Varför detta är bättre

- Ingen `docker compose up --build` för hela miljön.
- Endast `baserow` deployas om.
- Backend-iteration blir sekunder istället för minuter.
