# ADR 0002 — Hexagonal-lite architecture inside a single service

- Status: Accepted
- Date: 2026-10-19

## Context
The brief asks for "a backend microservice" and stresses clean design, maintainability and testable architecture.
We want new operations or transports to be easy to add, without over-engineering a calculator.

## Decision
A single Go service split into three layers:

1. **Domain** (`internal/calculator`): operations, the operation registry and domain errors. Pure Go, no I/O.
2. **Application** (`internal/app`): the calculate use case.
3. **Adapters** (`internal/adapters/httpapi`): HTTP handlers, DTOs, error mapping, middleware.

Dependencies point inward only. Interfaces are introduced only where there is a real second implementation or a
test seam ("lite").

## Consequences
- The math is tested without starting a server.
- A new operation is one file plus a test; a new transport (gRPC, CLI) reuses the domain unchanged.
- Alternatives considered: a flat `main.go` (fast but mixes concerns and is harder to test); multiple microservices
  (network overhead and operational cost with no benefit at this size).
