# Multi-stage build: compile in the Go image, run the static binary in a small Alpine image.

FROM golang:1.27.3-alpine3.24 AS build
WORKDIR /src

# Dependencies first, so this layer stays cached while only the code changes.
# (There are none today; the step keeps the Dockerfile right when one is added.)
COPY go.mod go.sum* ./
RUN go mod download

COPY . .
# CGO_ENABLED=0 gives a static binary that needs no C library at runtime.
# -trimpath drops local paths from the binary; -s -w drop debug symbols to make it smaller.
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

FROM alpine:3.24.2
# A fixed, unprivileged user: the server never needs root.
RUN adduser -D -H -u 10001 app
COPY --from=build /out/server /usr/local/bin/server
USER app

ENV PORT=8080
EXPOSE 8080
# Alpine's busybox wget is enough for a liveness check; no extra packages.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --start-interval=1s --retries=3 \
  CMD wget -qO /dev/null "http://127.0.0.1:${PORT}/healthz" || exit 1

ENTRYPOINT ["/usr/local/bin/server"]
