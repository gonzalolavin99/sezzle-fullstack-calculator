# ADR 0005 — Tailwind CSS for styling; optional live demo

- Status: Accepted
- Date: 2026-10-19

## Styling
Use Tailwind CSS with design tokens in the theme. It keeps styles next to components, avoids naming overhead,
and makes responsive and dark-mode variants explicit. Alternative considered: CSS modules (fine, but slower to
iterate on a small UI).

## Live demo (optional, after the core is done)
- **Frontend:** Vercel, built from `frontend/`, with `VITE_API_BASE_URL` pointing to the backend.
- **Backend:** the same Docker image on a container host with a free tier (for example Render or Fly.io).
  `ALLOWED_ORIGINS` set to the Vercel domain.
- The demo is a convenience for reviewers. The source of truth is the repository and `docker compose up`.

## Outcome (2026-10-20)
Deployed as planned: the frontend on Vercel (`VITE_API_BASE_URL`) and the backend's Docker image on Render's free tier
(`ALLOWED_ORIGINS` set to the Vercel domain, health check on `/healthz`, `PORT` provided by Render). URLs in the README.

## Consequences
- The deployed backend is the same artifact we test, which keeps the demo honest.
- Free tiers may sleep when idle; the README warns that the first request can be slow.
- Alternative considered: running the Go code as Vercel serverless functions. It would need a separate adapter
  and a different project layout, which adds risk close to the deadline.
