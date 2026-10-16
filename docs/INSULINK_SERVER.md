# Running next to Insulink

Kimbiss shares the server with Insulink. Insulink's `proxy` (nginx + certbot)
already owns ports 80 and 443, so Kimbiss opens no port: its app container
joins Insulink's Docker network as `kimbiss`, and the proxy gets one more
server block. Kimbiss keeps its own Postgres and its own compose project, so
either stack can be rebuilt without touching the other.

## 1. Start Kimbiss

```bash
cd kimbiss
cp .env.example .env    # POSTGRES_PASSWORD, KIMBISS_INVITE_CODE, CLAUDE_CODE_OAUTH_TOKEN
docker compose -f docker-compose.yml -f docker-compose.insulink.yml up -d --build
```

The token can be the same `CLAUDE_CODE_OAUTH_TOKEN` as in Insulink's `.env`.

`INSULINK_NETWORK` defaults to `insulink-api_default`, the network compose
creates when Insulink runs from a folder named `insulink-api`. Check with
`docker network ls` and set it in `.env` if the folder is named differently.

## 2. Add the domain to Insulink's proxy

Point a DNS record (here `kimbiss.lukasbreuer.de`) at the server, then add to
`insulink-api/proxy/default.conf`, first only the port 80 block:

```nginx
server {
    listen 80;
    server_name kimbiss.lukasbreuer.de;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}
```

Reload the proxy and fetch the certificate from inside `insulink-api`:

```bash
docker compose exec proxy nginx -s reload
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d kimbiss.lukasbreuer.de
```

Then add the HTTPS block and reload once more:

```nginx
server {
    listen 443 ssl;
    server_name kimbiss.lukasbreuer.de;
    # Meal photos travel base64 in the JSON body.
    client_max_body_size 4m;
    ssl_certificate /etc/letsencrypt/live/kimbiss.lukasbreuer.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kimbiss.lukasbreuer.de/privkey.pem;

    location / {
        # Resolved per request, so the proxy still starts while Kimbiss is down.
        resolver 127.0.0.11 valid=30s;
        set $kimbiss http://kimbiss:8080;
        proxy_pass $kimbiss;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
    }
}
```

The app's own nginx then serves the web app and passes `/v1/` on to the
Kimbiss api, so one domain covers both.
