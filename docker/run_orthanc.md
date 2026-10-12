# Running Orthanc for IVe

Orthanc is the DICOM server behind IVe's imaging pages (`/ive/table/dicom`).
Without it, `/api/dicom/*` returns 503 and everything else works.

The browser never talks to Orthanc. It serves full PHI and knows nothing about
IVe logins, so the `api` container proxies every request and strips patient
identifiers on the way. Keep Orthanc reachable from the `api` container only —
never publish it beyond loopback.

IVe expects it outside the compose stack, reached through `.env`:

```bash
ORTHANC_URL=http://host.docker.internal:8042
ORTHANC_USERNAME=          # blank = no Authorization header sent
ORTHANC_PASSWORD=
```

## Option A — a standalone container

Uses `docker/orthanc.json` from this repo (DICOMweb + Stone viewer plugins on,
authentication off). Run from the repo root:

```bash
docker run -d --name orthanc-ext --restart unless-stopped \
  -p 127.0.0.1:8042:8042 \
  -v "$PWD/docker/orthanc.json:/etc/orthanc/orthanc.json:ro" \
  -v orthanc-ext-db:/var/lib/orthanc/db \
  jodogne/orthanc-plugins:latest
```

- Images are stored in the `orthanc-ext-db` Docker volume, which survives
  `docker rm` of the container. `docker volume rm orthanc-ext-db` deletes them.
- **Apple silicon:** the image is amd64-only and runs emulated. Give the VM at
  least 6 GB (`colima start --memory 6 --cpu 4`) or it is OOM-killed while
  decoding (exit 137). First start takes ~30 s.
- **Colima:** the config path must be under your home directory — the only
  part of the Mac Colima shares with its VM.
- **Linux:** `host.docker.internal` is the Docker bridge gateway (usually
  `172.17.0.1`), not loopback, so publish there instead:
  `-p 172.17.0.1:8042:8042`.

## Option B — native install (Debian/Ubuntu)

```bash
sudo apt install orthanc orthanc-dicomweb
```

Config lives in `/etc/orthanc/*.json`, and Orthanc **merges every file there**:
a key defined in two files is a fatal startup error (exit code 15, "section X
is defined in 2 different configuration files"), not an override. Put your
settings in one file and remove duplicates from the others. Logs are in
`/var/log/orthanc/` (root only), not the journal.

Set `"RemoteAccessAllowed": true` and bind/listen so the Docker bridge gateway
can reach port 8042 (see the Linux note above).

## Authentication

`docker/orthanc.json` has authentication off, which is only acceptable while
Orthanc is bound to loopback or the Docker gateway. Anywhere else, turn it on:

```json
"AuthenticationEnabled": true,
"RegisteredUsers": { "ive": "a-long-random-password" }
```

and set `ORTHANC_USERNAME=ive` / `ORTHANC_PASSWORD=…` in `.env`. Orthanc's
shipped default is `orthanc`/`orthanc` — change it.

## Load test data

`docker/dicom-fixtures.py` writes a small synthetic study with **invented**
PHI (the API's de-identification is checked against it — never real patient
data). Needs `pydicom` and `numpy`:

```bash
pip install pydicom numpy
python3 docker/dicom-fixtures.py /tmp/dicom-fixtures
for f in /tmp/dicom-fixtures/*.dcm; do
  curl -s -X POST http://127.0.0.1:8042/instances \
    -H "Content-Type: application/dicom" --data-binary @"$f" >/dev/null
done
```

Real studies upload the same way (`POST /instances`), or through Orthanc's
own UI at <http://localhost:8042/app/explorer.html>.

## Verify

```bash
curl -s http://127.0.0.1:8042/system | grep Version
curl -s http://127.0.0.1:8042/statistics          # CountStudies > 0 after loading
```

Then in IVe (signed in), open <http://localhost:8080/ive/table/dicom> — the
studies should list, with no patient name, ID or birth date anywhere.

The Stone viewer at <http://localhost:8042/stone-webviewer/> is Orthanc's own
and shows full PHI — it is for checking data, not for users.

`/api/dicom/studies` returning 503 means the api cannot reach `ORTHANC_URL`;
check `docker compose logs api` and that the port is published where the
container can reach it (Linux note above).
