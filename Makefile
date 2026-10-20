# Developer shortcuts for the full-stack calculator.
# Recipes only use commands that behave the same in POSIX sh and Windows cmd.exe,
# so the same Makefile works on Linux/macOS, in CI and on Windows.

GOLANGCI_LINT_VERSION := v2.15.0

.DEFAULT_GOAL := help

.PHONY: help tools \
	dev dev-backend dev-frontend \
	test test-backend test-frontend test-race \
	coverage coverage-backend coverage-frontend \
	lint lint-backend lint-frontend \
	fmt fmt-backend fmt-frontend \
	docker-up docker-down e2e

define HELP
Usage: make <target>

  help        Show this list
  tools       Install golangci-lint $(GOLANGCI_LINT_VERSION) into the Go bin directory
  dev         Run backend and frontend in development mode
  test        Run all unit tests (backend and frontend)
  test-race   Run backend tests with the race detector in a Linux container (needs Docker)
  coverage    Generate coverage reports for both layers
  lint        Run golangci-lint, ESLint and Prettier checks
  fmt         Format Go and frontend code
  docker-up   Build and start the full stack on http://localhost:8080
  docker-down Stop the full stack
  e2e         Run the Playwright smoke test against the running stack (docker compose up --build -d --wait)

Each target also has -backend and -frontend variants, for example: make test-backend
endef

# $(info) prints from make itself, so the output does not depend on the shell.
# `exit 0` exists in both sh and cmd.exe and avoids "Nothing to be done for 'help'".
help:
	$(info $(HELP))
	@exit 0

tools:
	go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@$(GOLANGCI_LINT_VERSION)

dev:
	$(MAKE) -j2 dev-backend dev-frontend

dev-backend:
	cd backend && go run ./cmd/server

dev-frontend:
	cd frontend && npm run dev

test: test-backend test-frontend

# The race detector needs cgo, which is not available on a default Windows setup; CI runs it on Linux,
# and `make test-race` runs it locally inside the official Go image.
test-backend:
	cd backend && go test ./...

test-race:
	docker run --rm -v "$(CURDIR)/backend:/src" -w /src golang:1.27 go test -race ./...

test-frontend:
	cd frontend && npm test

coverage: coverage-backend coverage-frontend

coverage-backend:
	cd backend && go test -coverprofile=coverage.out ./... && go tool cover -func=coverage.out && go tool cover -html=coverage.out -o coverage.html

coverage-frontend:
	cd frontend && npm run coverage

lint: lint-backend lint-frontend

lint-backend:
	cd backend && golangci-lint run ./... && golangci-lint fmt --diff

lint-frontend:
	cd frontend && npm run lint

fmt: fmt-backend fmt-frontend

fmt-backend:
	cd backend && golangci-lint fmt

fmt-frontend:
	cd frontend && npm run format

docker-up:
	docker compose up --build

docker-down:
	docker compose down

# Needs the stack running and a browser: `npx playwright install chromium` once (run inside frontend/).
e2e:
	cd frontend && npm run e2e
