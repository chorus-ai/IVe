# Running Redis for IVe

Redis is optional. The `api` container uses it only as a cache for OMOP
queries; if it is unreachable, caching is off and everything else works. It
holds nothing that needs backing up.

IVe expects it outside the compose stack, reached through `.env`:

```bash
REDIS_HOST=host.docker.internal   # the machine Docker runs on
REDIS_PORT=6379
```

Host and port only — the server has no Redis password or TLS settings.

## Option A — Homebrew (macOS)

```bash
brew install redis
redis-server /opt/homebrew/etc/redis.conf --daemonize yes   # this session only
# or, to start at login:
brew services start redis
```

The default config binds `127.0.0.1`, which is what you want: Docker Desktop
and Colima forward `host.docker.internal` to the Mac's loopback, so containers
reach it while the network does not.

Stop with `redis-cli shutdown` (or `brew services stop redis`).

## Option B — a standalone container

Works anywhere Docker does, and keeps Redis out of the IVe stack's lifecycle:

```bash
docker run -d --name redis-ext --restart unless-stopped \
  -p 127.0.0.1:6379:6379 redis:7-alpine
```

**Linux:** `host.docker.internal` resolves to the Docker bridge gateway
(usually `172.17.0.1`), not to loopback, so a port published on `127.0.0.1` is
unreachable from the `api` container. Publish on the gateway instead:

```bash
docker run -d --name redis-ext --restart unless-stopped \
  -p 172.17.0.1:6379:6379 redis:7-alpine
```

Same for a native `apt install redis-server`: add the gateway to `bind` in
`/etc/redis/redis.conf` (`bind 127.0.0.1 172.17.0.1`). Never bind `0.0.0.0` on
a machine reachable from outside — there is no password.

## Connect IVe

The `api` container probes Redis **once at startup** and stays uncached for
the rest of its run if that fails. Start Redis first, or restart the api after:

```bash
docker compose restart api
```

## Verify

```bash
redis-cli ping                                   # PONG
docker compose logs api | grep -i redis          # no "connect failed"
```

Then load any OMOP page in IVe and check that a cache key appeared:

```bash
redis-cli --scan --pattern 'omop:*' | head
```

`[cache] read failed … The client is offline` in the api log means the api
started before Redis was reachable — restart it.
