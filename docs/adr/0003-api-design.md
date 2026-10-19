# ADR 0003 — Single calculate endpoint driven by an operation registry

- Status: Accepted
- Date: 2026-10-19

## Context
The backend must expose REST endpoints for calculator operations, validate input and return JSON.

## Decision
- `POST /api/v1/calculate` with `{ "operation": "...", "operands": [...] }`.
- `GET /api/v1/operations` lists supported operations and their arity, so the frontend can render them dynamically.
- `GET /healthz` for liveness.
- Versioned under `/api/v1`.
- Errors use one shape: `{ "error": { "code": "...", "message": "..." } }`, with stable machine-readable codes.
- 400 for malformed requests; 422 for well-formed requests whose math is invalid (for example division by zero).

## Consequences
- One validation path and one handler; adding an operation needs no new route.
- The frontend can show new operations without code changes.
- Alternative considered: one endpoint per operation (`/add`, `/divide`). It reads slightly more "RESTful" per
  operation but duplicates handlers and validation. Easy to add later as thin aliases if needed.
