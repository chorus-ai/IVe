# IVe production images. Synced to the IVe repo root by
# scripts/sync_downstream.py — edit the copy in docker/ive/.
#
# Two targets from one file:
#   web  nginx serving the Vite build, proxying /api and /docs to `api`
#   api  Express (server.js) with only the ive, omop, vocab, dicom and
#        waveform features.
#
# nginx sits in front rather than Express serving client/dist itself because
# server.js has no SPA fallback: express.static answers `/`, but a refresh on
# /ive/table/dicom falls through to the JSON 404 handler.
#
# Python is in the api image because /api/waveform/wfdb runs
# python-scripts/wfdb-handler.py per decode request (utils/python.js). No
# worker: none of the five features ships a jobs/ folder.

# ---- client build ----------------------------------------------------------
FROM node:20-bookworm-slim AS client-build
WORKDIR /src/client
# Lockfiles are gitignored upstream; the sync config copies them here as
# root_files, but a fresh clone may not have them. With one: `npm ci`,
# reproducible. Without: `npm install`, whatever the registry resolves today —
# which has already broken once on a half-published @aws-sdk release.
# --legacy-peer-deps because react-helmet-async@2 declares a react@18 peer and
# the app is on react@19.
COPY client/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps --no-audit --no-fund; \
    else npm install --legacy-peer-deps --no-audit --no-fund; fi
COPY client ./
# Vite inlines import.meta.env.VITE_* at build time; upstream these come from
# client/.env, which is never synced. Unset, the sign-in page reads "Sign in
# to  Apps", tab titles start "undefined |", and GitHub login gets
# client_id=undefined. Browser-visible values only — never put a secret here.
ARG VITE_APP_NAME=IVe
ARG VITE_API_DOC=/docs
ARG VITE_GITHUB_CLIENT_ID=
ENV VITE_APP_NAME=$VITE_APP_NAME \
    VITE_API_DOC=$VITE_API_DOC \
    VITE_GITHUB_CLIENT_ID=$VITE_GITHUB_CLIENT_ID
# `vite build` directly — no tsc step, the TS error baseline is non-zero.
RUN npx vite build

# ---- web -------------------------------------------------------------------
FROM nginx:1.27-alpine AS web
# The nginx image runs envsubst over /etc/nginx/templates/*.template at start,
# filling ${API_UPSTREAM}; nginx's own $vars are left alone.
ENV API_UPSTREAM=http://api:8080
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=client-build /src/client/dist /usr/share/nginx/html
EXPOSE 80

# ---- api -------------------------------------------------------------------
# trixie, not bookworm: sqlite3@6's prebuilt binary needs glibc >= 2.38 and
# bookworm ships 2.36 — the module fails to load the moment a sqlite dialect is
# configured (Postgres-only setups never require it, so they don't notice).
FROM node:20-trixie-slim AS api
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*
# Decoder deps only (numpy, scipy, h5py, wfdb, binfilepy) — see the header of
# docker/decoder-requirements.txt for why not python-scripts/requirements.txt.
COPY docker/decoder-requirements.txt /tmp/
RUN python3 -m venv /opt/py \
    && /opt/py/bin/pip install --no-cache-dir -r /tmp/decoder-requirements.txt
WORKDIR /srv/server
COPY server/package*.json ./
# Same lockfile fallback. --legacy-peer-deps because current bullmq@5 declares
# an optional redis@>=5 peer while the server is on redis@4 (utils/redis.js).
RUN if [ -f package-lock.json ]; then npm ci --omit=dev --legacy-peer-deps --no-audit --no-fund; \
    else npm install --omit=dev --legacy-peer-deps --no-audit --no-fund; fi
COPY server ./
# First-run bootstrap (ive feature + admin user); see docker/README.md.
COPY docker/seed.js /srv/seed.js
ENV NODE_ENV=production \
    PORT=8080 \
    FEATURES=ive,omop,vocab,dicom,waveform \
    PYTHON_PATH=/opt/py/bin/python3
USER node
EXPOSE 8080
# /api/status sits behind auth, so a healthy server answers 401 — anything
# below 500 counts as up.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s \
  CMD node -e "require('http').get('http://127.0.0.1:8080/api/status',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "server.js"]
