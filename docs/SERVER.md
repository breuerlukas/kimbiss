# Running on a shared server

Kimbiss runs on the same machine as other services without touching them. It
binds neither port 80 nor 443 of the host: Caddy terminates TLS on its own
ports (8088 for HTTP, 8443 for HTTPS) and fetches its own Let's Encrypt
certificate. Kimbiss has its own compose project, network, Postgres and
volumes, and hard memory and CPU limits, so it can't starve its neighbours.

## 1. Start Kimbiss on the server

The server builds nothing. CI publishes `ghcr.io/breuerlukas/kimbiss-api` and
`ghcr.io/breuerlukas/kimbiss-app` on every push to `main`, and the server pulls
them. The checkout lives in `/home/kimbiss`, owned by the user `kimbiss`, who is
in the `docker` group.

```bash
git clone https://github.com/breuerlukas/kimbiss.git /home/kimbiss && cd /home/kimbiss
cp .env.example .env    # POSTGRES_PASSWORD, KIMBISS_INVITE_CODE, CLAUDE_CODE_OAUTH_TOKEN, KIMBISS_DOMAIN
echo "COMPOSE_FILE=docker-compose.yml:docker-compose.server.yml" >> .env
docker compose pull && docker compose up -d
```

With `COMPOSE_FILE` in `.env`, every `docker compose` in this folder uses the
server setup without `-f`. Check first that 8088 and 8443 are free
(`ss -ltn`); otherwise pick others with `KIMBISS_HTTP_PORT` and
`KIMBISS_HTTPS_PORT`.

## 2. Route the domain at the edge proxy

The edge nginx routes port 80 by Host header and passes port 443 through by
SNI. Kimbiss needs one entry in each, pointing at its own ports on the server
(here `192.168.178.54`).

In the `http` block, a new server:

```nginx
    # Kimbiss
    server {
        listen 80;
        listen [::]:80;
        server_name kimbiss.lukasbreuer.de;

        location / {
            proxy_pass http://192.168.178.54:8088;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
```

In the `stream` map, one line:

```nginx
        kimbiss.lukasbreuer.de  192.168.178.54:8443;
```

Then `nginx -t && nginx -s reload` on the edge. Without the map line the
`default` would send Kimbiss traffic to the service behind 443 of that host,
so it has to be there.

## 3. Certificate

Caddy requests the certificate on its first start, once DNS for the domain
points at the edge and the routes above are live. If it started earlier, it
retries on its own; `docker compose logs caddy` shows the progress.

## 4. Automatic deployment

A merge to `main` reaches the server by itself within about five minutes, the
same way as Insulink:

1. CI (`.github/workflows/ci.yml`) builds and tests api and app, then pushes
   both images as `:latest` and `:sha-<commit>`.
2. A systemd timer on the server (`deploy/kimbiss-update.timer`) runs every five
   minutes: `git pull --ff-only` (so compose and Caddyfile changes arrive too),
   `docker compose pull` for api, app and caddy one after the other (in
   parallel, images sharing a layer race in containerd and the pull fails),
   `docker compose up -d`, a Caddy reload,
   and a prune of old images. Compose only restarts a container whose image or
   configuration changed.

Pull instead of push: GitHub holds no SSH key and no way into the server; a
compromised workflow can at worst publish a bad image. Postgres is never
pulled, its major version changes only by hand (dump, new volume, restore).

### Set it up once

1. **Make the images public.** After the first CI run on `main`, open both
   packages on GitHub (profile, Packages, `kimbiss-api` and `kimbiss-app`,
   Package settings) and change the visibility to public. A first push creates
   them private, and the server would need `docker login ghcr.io` otherwise.
   They hold no secrets: those come from `.env`.
2. **Back up the database:**
   ```bash
   cd /home/kimbiss
   docker compose -f docker-compose.yml -f docker-compose.server.yml exec postgres \
     pg_dump -U postgres kimbiss > ~/kimbiss-backup.sql
   ```
3. **Check the volume name.** `docker volume ls` must show `kimbiss_pgdata`.
   Compose now pins the project name `kimbiss`; a folder of another name used
   to give another prefix. If it shows something else, stop here and change
   `name:` in `docker-compose.yml` to that prefix first, or Postgres starts on an
   empty volume.
4. **Switch to the images:**
   ```bash
   git pull --ff-only
   echo "COMPOSE_FILE=docker-compose.yml:docker-compose.server.yml" >> .env
   docker compose pull && docker compose up -d
   docker compose ps          # postgres, api, app, caddy all up
   ```
5. **Install the timer:**
   ```bash
   sudo cp deploy/kimbiss-update.* /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now kimbiss-update.timer
   ```
   The unit runs as user `kimbiss` in `/home/kimbiss`. For another user or
   folder, edit `User=` and `WorkingDirectory=` in the copy under
   `/etc/systemd/system/`, then `daemon-reload` again.
   After a change to the units in `deploy/`, copy them again, then
   `sudo systemctl daemon-reload && sudo systemctl restart kimbiss-update.timer`.
   A drop-in under `kimbiss-update.service.d/` survives the copy.
6. **Check it:**
   ```bash
   systemctl list-timers kimbiss-update.timer       # next run
   sudo systemctl start kimbiss-update.service      # one run right now
   journalctl -u kimbiss-update.service -n 50       # what it did
   ```

Leave the tracked files on the server alone: a local edit makes
`git pull --ff-only` fail, and the run stops before touching any container
(`git status` shows the culprit, `git checkout -- <file>` drops it). Server
settings belong in `.env`.

To roll back, revert the commit on `main`; the timer deploys that. In a hurry:
`sudo systemctl stop kimbiss-update.timer`, then
`docker tag ghcr.io/breuerlukas/kimbiss-api:sha-<commit> ghcr.io/breuerlukas/kimbiss-api:latest`
and `docker compose up -d`; start the timer again once `main` is fixed.
