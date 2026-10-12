# Running IVe with Docker

Two containers, built from the `Dockerfile` at the repo root:

| service | what it is | port |
|---|---|---|
| `web` | nginx serving the built client; proxies `/api` and `/docs` to `api` | `WEB_PORT` (default **8080**) |
| `api` | Express with the `ive`, `omop`, `vocab`, `dicom` and `waveform` features, plus Python for waveform decoding | internal only |

Redis, Orthanc and (optionally) Postgres run outside this stack. By default
the databases are SQLite files in `./server/data`, so nothing else is needed
to get started. To add the external services:

- [run_redis.md](run_redis.md) — OMOP query cache (optional)
- [run_orthanc.md](run_orthanc.md) — DICOM server for the imaging pages, plus
  synthetic test data

## Requirements

- Docker with Compose v2 (Docker Desktop, or Colima on macOS)
- Internet access while building (npm registry, base images)

## Quick start

```bash
cp .env.example .env
# set JWT_SECRET:  openssl rand -hex 32
mkdir -p server/data
docker compose up -d --build
```

Create `server/data` yourself before the first `up`. It is gitignored, so a
fresh clone lacks it, and if Docker creates it instead it is owned by root —
the `api` container runs as `node` (uid 1000) and then cannot create its
SQLite files (`Failed to sync db: SQLITE_CANTOPEN` in the log). On Linux, if
your uid is not 1000, also run `sudo chown 1000 server/data`.

Then create the first admin. A fresh database has no users, and IVe's admin
UI needs an `ive` feature row and an admin membership that signing up does not
create — the seed script does all three:

```bash
docker compose exec -e IVE_ADMIN_PASSWORD='choose-a-password' api \
  node /srv/seed.js --username admin --email admin@example.org
```

Open <http://localhost:8080> and sign in. Re-running the seed is safe: it
leaves existing rows alone, re-grants admin, and resets the password only when
one is given.

## Data

One folder holds everything, as in upstream: `BUCKET_PATH` in `.env`
(default `./server/data`), mounted read-write at `/srv/server/data`, which is
also the container's `BUCKET_PATH`.

| file / folder | contents | if absent |
|---|---|---|
| `app.sqlite3` | users, features, IVe layouts/widgets, vocab concepts | created empty on first boot |
| `omop.sqlite3` | OMOP CDM tables | created empty on first boot |
| `waveforms/` | WFDB records, e.g. `mimic_iv/p100/...` | waveform widget shows nothing |
| anything else | names listed by `/api/bucket`; contents not served | — |

Records are addressed relative to the folder, e.g.
`waveforms/mimic_iv/p100/p10079700/85594648/85594648_0001` for the waveform
widget's built-in sample.

What a logged-in user can reach in the folder: file **names**, via
`/api/bucket`, and decoded **WFDB records**, via `/api/waveform/wfdb`, which
refuses any path outside the folder (`..`, absolute paths, symlinks out). No
endpoint in this build returns another file's bytes, so the databases sharing
the folder are not downloadable. Adding a feature that serves raw bucket
files (upstream's `cada` does, without a containment check) would change
that.

**This repo ships no data.** `server/data/` is gitignored and dockerignored, so
nothing in it is committed or built into the image. Put an existing
`omop.sqlite3` there *before* `docker compose up` to use it; the server only
creates tables that are missing and never alters existing ones.

Back up by copying the files with the stack stopped (`docker compose stop api`)
— SQLite files copied mid-write can be inconsistent.

To keep data elsewhere, set `BUCKET_PATH` in `.env` — the same ownership
rule applies. With Colima on macOS the path must also be under your home
directory, the only part of the Mac it shares with its VM.

## Configuration

Everything lives in `.env`; `.env.example` documents each variable.

| need | set |
|---|---|
| Postgres instead of SQLite | the commented `*_DB_*` block in `.env.example`. Connections always use SSL, and the schema must already exist. |
| Redis cache | `REDIS_HOST` / `REDIS_PORT`. Optional — if unreachable, caching is off and everything else works. Host/port only: no password or TLS. |
| DICOM / imaging | `ORTHANC_URL` (+ credentials). Without it the imaging pages return 503. |
| DICOM PHI scan | `AI_SERVICE_URL` and `INTERNAL_SERVICE_TOKEN`. Without them only that endpoint returns 503. |
| GitHub / Azure login | the OAuth block. Blank = local accounts only. |

`host.docker.internal` reaches services on the machine running Docker.

## HTTPS

The image runs with `NODE_ENV=production`, which marks the login cookie
`Secure`: browsers send it only over HTTPS, or to `localhost`. For any other
hostname, terminate TLS in front of `web` (a reverse proxy or load balancer)
and set `APP_HOST` to the public URL.

## Operations

```bash
docker compose logs -f api        # server log
docker compose restart api        # pick up .env changes or swapped db files
docker compose up -d --build      # after pulling new code
docker compose down               # stop; data in ./server/data is untouched
```

## Known gaps

- **Unpinned dependencies on a fresh clone.** The npm lockfiles are not
  committed, so the build installs whatever the registry resolves that day,
  which has broken at least once on a half-published release. When
  `package-lock.json` files are present the build uses `npm ci` instead.
- **`/api/bucket` lists outside the bucket.** It joins the request path onto
  `BUCKET_PATH` without a containment check, so `..` lists other directories
  (names only). nginx rejects any request containing `..` before it reaches
  the api; reaching `api` directly bypasses that, and the real fix belongs in
  `server/handler/bucket.js`.
- **One `api` container only** while on SQLite.

## Where this comes from

The code and these Docker files are synced from the upstream hulab-apps
repository by `scripts/sync_downstream.py`. Changes to `client/`, `server/`,
the `Dockerfile`, `docker-compose.yml` or `docker/` made here are overwritten on
the next sync — make them upstream (`hulab-apps-container/ive/` for the Docker
files).
