# Requirements — Full-Stack Calculator (Sezzle take-home)

Source: take-home email from Sezzle Recruiting, received October 2026.
Deadline: **5 business days** from receipt. Suggested effort: **~2–4 hours**.

## Objective

Build a full-stack calculator application with a **React frontend** and a **backend microservice**.
The frontend consumes the backend API to perform basic and advanced arithmetic operations.
Focus on clean design, maintainable code and testable architecture.

## Functional requirements

### Operations
- Addition, subtraction, multiplication, division
- Optional: exponentiation, square root, percentage

### Frontend (React)
- Intuitive UI for entering input and displaying results
- Input validation and error handling
- Responsive design (basic mobile support)

### Backend (REST API)
- Expose endpoints for calculator operations
- Validate input and handle edge cases (division by zero, invalid data)
- Return results in JSON format

## Non-functional requirements
- Clean, readable and idiomatic code (frontend and backend)
- Unit tests covering key functionality for both layers
- Documentation: setup instructions, API usage and design rationale
- Optional: Dockerfile for full-stack deployment

## Constraints
- Frontend: React (TypeScript preferred)
- Backend: Go preferred

## Deliverables
1. Git repository with frontend and backend code
2. README with setup instructions, API examples and design decisions
3. Unit tests and coverage report
4. Optional: Dockerfile to run frontend and backend together

## Instructions
1. Use any AI tooling you would like
2. Spend ~2–4 hours. Prioritize correctness, clarity and maintainability over extra features
3. Push the solution to GitHub, GitLab or another Git repository
4. Share the repository link for evaluation
5. **Share any prompts used in the work**
6. README must include: setup instructions; how to run frontend and backend; examples of API calls (if REST); design decisions or assumptions

Submission: through the Greenhouse link in the email.

## Requirement traceability

Every row must be ✅ before submitting. Claude Code updates this table as tasks close.

| # | Requirement | Where it is satisfied | Status |
|---|---|---|---|
| R1 | Add, subtract, multiply, divide | `backend/internal/calculator`, UI keypad and keyboard | ✅ |
| R2 | Power, square root, percentage (optional) | same; UI keys built from `GET /api/v1/operations` | ✅ |
| R3 | Intuitive UI for input and results | `frontend/src/features/calculator` (display, keypad, keyboard, history) | ✅ |
| R4 | Frontend input validation and error handling | reducer + API client + error banner; flow tests in `Calculator.test.tsx` | ✅ |
| R5 | Responsive design | Tailwind layout; checked in Chromium at 360px and 1280px, light and dark | ✅ |
| R6 | REST endpoints for operations | `backend/internal/adapters/httpapi` | ✅ |
| R7 | Backend validation and edge cases | domain errors + handler tests | ✅ |
| R8 | JSON responses (success and errors) | handler + OpenAPI spec | ✅ |
| R9 | Clean, idiomatic code | golangci-lint, ESLint, Prettier and strict `tsc` in CI | ✅ |
| R10 | Unit tests, both layers | `go test` (backend 96.4%), Vitest (frontend 98.8%) | ✅ |
| R11 | Coverage report | `make coverage`; HTML reports as CI artifacts; coverage table and CI badge in the README | ✅ |
| R12 | README: setup, run, API examples, design decisions | `README.md` | ✅ |
| R13 | Dockerfile(s) running both together | `docker compose up --build`; built and run in CI (`e2e` job) | ✅ |
| R14 | Prompts shared | `docs/ai/PROMPTS.md`, `CLAUDE.md`, linked from the README | ✅ |
| R15 | Pushed to a public Git repo, link submitted | GitHub | ⬜ |
