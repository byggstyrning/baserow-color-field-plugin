ARG BASEROW_VERSION=2.1.6

# =============================================================================
# Stage 1: Clone Baserow source and rebuild web-frontend with our plugin
# =============================================================================
FROM node:24-trixie-slim AS frontend-builder

ARG BASEROW_VERSION
ENV YARN_CACHE_FOLDER=/tmp/.yarn-cache \
    NUXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=6144"

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
RUN git clone --depth 1 --branch ${BASEROW_VERSION} https://github.com/baserow/baserow.git .

COPY plugins/baserow_color_field/web-frontend \
     /build/web-frontend/plugins/baserow_color_field/

RUN cd /build/web-frontend && yarn install --pure-lockfile

RUN cd /build/web-frontend && yarn add vue-accessible-color-picker colorjs.io

RUN ln -sf /build/web-frontend/node_modules /build/premium/web-frontend/node_modules \
    && ln -sf /build/web-frontend/node_modules /build/enterprise/web-frontend/node_modules

ENV ADDITIONAL_MODULES="/build/web-frontend/plugins/baserow_color_field/module.js" \
    NODE_ENV=production

RUN cd /build/web-frontend && yarn run build \
    && find .output -type f -name "*.map" -delete

# =============================================================================
# Stage 2: Final all-in-one image with plugin
# =============================================================================
FROM baserow/baserow:${BASEROW_VERSION}

COPY --chown=9999:9999 --from=frontend-builder \
     /build/web-frontend/.output /baserow/web-frontend/.output

COPY --chown=9999:9999 \
     plugins/baserow_color_field /baserow/data/plugins/baserow_color_field

RUN mkdir -p /baserow/container_markers \
    && cp -r /baserow/data/plugins/baserow_color_field/backend/src/baserow_color_field \
       /baserow/venv/lib/python3.14/site-packages/baserow_color_field \
    && touch /baserow/container_markers/baserow_color_field.backend-built \
    && chown -R 9999:9999 /baserow/container_markers \
       /baserow/venv/lib/python3.14/site-packages/baserow_color_field
