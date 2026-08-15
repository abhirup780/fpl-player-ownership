# FPL Ownership Live Tracker

A live-updating dashboard for Fantasy Premier League player ownership: trend lines,
a "most owned" leaderboard, a momentum bubble chart, fast risers/breakouts, fast
fallers, player search & comparison, and a "My Team" view — all built on the
public FPL API with real historical storage.

## How data collection works

There's no admin panel — the app collects data itself:

- Every browser tab that has the dashboard open pings `POST /api/snapshot` every
  few minutes. That route fetches `bootstrap-static` from the FPL API and stores
  one ownership snapshot per player, throttled to at most once every 5 minutes
  regardless of how many tabs are open.
- `GET /api/cron` does the same thing. `vercel.json` wires it up as a
  once-daily backstop (Vercel Hobby rejects any cron schedule that fires more
  than once a day, so that's the ceiling there — on Pro you can tighten it).
- The real 5-minute cadence comes from `.github/workflows/snapshot-cron.yml`,
  a GitHub Actions workflow that pings `GET /api/cron` every 5 minutes
  regardless of hosting plan or whether anyone has a tab open. It needs two
  repo secrets: `APP_URL` (your deployed URL, no trailing slash) and
  `CRON_SECRET` (must match the value set in Vercel's project env vars).
- The first request ever made to `/api/players` seeds the database automatically
  if it's empty, so the dashboard is never blank on a fresh deploy.

## Local development

```bash
npm install
npm run dev
```

Local dev needs no database setup — with no `POSTGRES_URL` set, the app stores
history in a SQLite file at `data/ownership.db` (created automatically, and
already in `.gitignore`).

Open http://localhost:3000. Ownership history builds up as snapshots accumulate,
so trend charts fill in over the following hours — that's expected, not a bug.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add a Postgres database from the Vercel dashboard (Storage → Postgres, which
   is Neon-backed) — Vercel injects `POSTGRES_URL` into your project
   automatically. Any other Postgres (e.g. a Neon project created directly)
   works too; just set `POSTGRES_URL` yourself.
3. (Optional) Set `CRON_SECRET` in your Vercel project's environment variables —
   the same value is automatically sent as a bearer token by Vercel Cron, and
   `/api/cron` will reject requests without it once set.
4. Deploy. `vercel.json` already declares an hourly cron hitting `/api/cron`
   (Pro+; Hobby collapses this to once/day — see above).

## Time ranges

`live` (~20 min), `1h`, `6h`, `24h`, `7d`, `gw` (since the current gameweek's
deadline), and `season` (since the season's first deadline, or the first
snapshot ever recorded if that's more recent). Every panel — most owned deltas,
risers/fallers, the momentum chart, and the trend chart — reads from the same
selected range.

## Notes

- "My Team" only needs your public numeric FPL Team ID (from your team's URL),
  never your login — it calls the public `entry/{id}` endpoints.
- The FPL API has no official CORS/rate-limit docs; all FPL requests happen
  server-side in Next.js route handlers, never from the browser.
