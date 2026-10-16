# Running on a shared server

Kimbiss runs on the same machine as other services without touching them. It
binds neither port 80 nor 443 of the host: Caddy terminates TLS on its own
ports (8088 for HTTP, 8443 for HTTPS) and fetches its own Let's Encrypt
certificate. Kimbiss has its own compose project, network, Postgres and
volumes, and hard memory and CPU limits, so it can't starve its neighbours.

## 1. Start Kimbiss on the server

```bash
git clone https://github.com/breuerlukas/kimbiss.git && cd kimbiss
cp .env.example .env    # POSTGRES_PASSWORD, KIMBISS_INVITE_CODE, CLAUDE_CODE_OAUTH_TOKEN, KIMBISS_DOMAIN
docker compose -f docker-compose.yml -f docker-compose.server.yml up -d --build
```

Check first that 8088 and 8443 are free (`ss -ltn`); otherwise pick others
with `KIMBISS_HTTP_PORT` and `KIMBISS_HTTPS_PORT`.

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
