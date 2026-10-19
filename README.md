# Kimbiss

A food diary you fill by taking a photo of your meal.

Snap your plate, Kimbiss estimates energy, protein, carbs and fat, you check
the numbers and save. A short setup guide turns your height, weight and
goal weight into daily targets. It runs as an installable web app, so it
works on an iPhone without the App Store.

## Modules

| Module | Stack | What it does |
|--------|-------|--------------|
| `kimbiss-api` | Spring Boot 4, Java 25, Postgres | Accounts, sessions, profile, meals, weights, photo estimate |
| `kimbiss-app` | React 19, Vite, Tailwind, PWA | The web app, served by nginx, which also proxies `/v1/` to the api |

## Run it

```bash
cp .env.example .env    # set POSTGRES_PASSWORD, KIMBISS_INVITE_CODE, CLAUDE_CODE_OAUTH_TOKEN
docker compose up -d --build
```

The app listens on `KIMBISS_PORT` (8090). Put HTTPS in front of it (your
reverse proxy, Caddy, a Cloudflare tunnel); iOS only installs a web app over
HTTPS.

**On the iPhone:** open the URL in Safari, Share, *Add to Home Screen*.

**On a shared server:** `docs/SERVER.md` runs it with its own TLS on its own
ports, without touching anything else on the host, and pulls every merge to
`main` by itself within five minutes.

## Who may use it

The photo estimate spends your Claude subscription, so the server is closed by
default:

- **Invite only.** Sign-up needs `KIMBISS_INVITE_CODE`. Once everyone has an
  account, empty it and restart the api; sign-up is then closed.
- **Sessions.** Every other route needs a bearer token: 32 random bytes, stored
  only as a SHA-256 hash, one per device, revoked on sign-out.
- **Daily cap.** At most `KIMBISS_ESTIMATES_PER_DAY` (30) estimates per user and
  day, so even a stolen session can't burn the subscription.
- **Sign-in throttle.** Five wrong passwords lock that name for 15 minutes.
  Passwords are PBKDF2-SHA256 hashed with 600,000 iterations.

## Photo estimate

The api runs the Claude Code CLI headless per photo, with no tools, no MCP
servers and no settings, so text inside a photo has nothing to call. The answer
is schema-checked JSON with one item per food. Photos are not stored.

The prompt is Insulink's: the model first writes down what it can read on the
packaging, then counts the pieces (slices, rolls, biscuits) one by one and only
then weighs them, since a miscount is the costliest mistake. It runs on Opus
5.5, which counts noticeably better than Sonnet; a run takes 5 to 30 seconds.

Sign-in token: run `claude setup-token` on any machine with a browser and put
the token into `.env` as `CLAUDE_CODE_OAUTH_TOKEN`. It lasts about a year. For a
deployment that serves other people, use `ANTHROPIC_API_KEY` instead.

## Develop

```bash
# api on :18080 against a local Postgres
cd kimbiss-api
SERVER_PORT=18080 KIMBISS_INVITE_CODE=dev ./gradlew bootRun
./gradlew test

# app on :5173, proxies /v1 to :18080 (override with KIMBISS_API)
cd kimbiss-app
npm install
npm run dev
npm run check    # target maths and locale self-checks
```

## Daily targets

Mifflin-St Jeor resting energy times an activity factor gives the maintenance
intake. The pace (0.25, 0.5 or 0.75 kg a week) shifts it by 7700 kcal per kilo,
never below 1200 kcal (female) or 1500 kcal (male). Protein is 1.8 g per kilo of
the goal weight, fat 30 % of the energy, carbs the rest. The guide refuses
a goal weight below a BMI of 18.5. All targets stay editable.

Estimates, not medical advice.
