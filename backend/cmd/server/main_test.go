package main

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gonzalolavin99/sezzle-fullstack-calculator/backend/internal/platform"
)

func TestRunFailsOnInvalidConfig(t *testing.T) {
	getenv := func(key string) string {
		if key == "PORT" {
			return "not-a-port"
		}
		return ""
	}

	if err := run(context.Background(), getenv, &bytes.Buffer{}); err == nil {
		t.Fatal("run() with an invalid PORT returned nil, want an error")
	}
}

// Cancelling the context simulates SIGTERM: run must shut down cleanly and return nil.
// run waits for the serve goroutine before returning, so reading the logs afterwards is safe.
func TestRunShutsDownWhenContextIsCancelled(t *testing.T) {
	getenv := func(key string) string {
		if key == "PORT" {
			return "0" // any free port
		}
		return ""
	}
	var logs bytes.Buffer
	ctx, cancel := context.WithCancel(context.Background())
	cancel() // already cancelled: run starts listening, then shuts down at once

	done := make(chan error, 1)
	go func() { done <- run(ctx, getenv, &logs) }()

	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("run() error = %v, want nil after shutdown", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("run() did not return after the context was cancelled")
	}

	for _, want := range []string{"server starting", "server stopped"} {
		if !strings.Contains(logs.String(), want) {
			t.Errorf("logs do not contain %q:\n%s", want, logs.String())
		}
	}
}

// The production middleware order matters: Recover must sit inside Logging (so a panic is
// logged as 500) and RequestID outside both (so every log line has the ID); CORS headers
// must survive error responses.
func TestProductionMiddlewareOrder(t *testing.T) {
	var logs bytes.Buffer
	logger := platform.NewLogger(&logs, slog.LevelInfo)
	cfg := platform.Config{AllowedOrigins: []string{"http://localhost:5173"}}
	panicking := http.HandlerFunc(func(http.ResponseWriter, *http.Request) { panic("boom") })

	handler := withMiddleware(panicking, cfg, logger)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	req.Header.Set("X-Request-ID", "req-42")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Errorf("Access-Control-Allow-Origin = %q, want the allowed origin on error responses", got)
	}

	var requestLog map[string]any
	for _, line := range strings.Split(strings.TrimSpace(logs.String()), "\n") {
		var entry map[string]any
		if err := json.Unmarshal([]byte(line), &entry); err == nil && entry["msg"] == "request" {
			requestLog = entry
		}
	}
	if requestLog == nil {
		t.Fatalf("no request log line in:\n%s", logs.String())
	}
	if requestLog["status"] != float64(500) || requestLog["request_id"] != "req-42" {
		t.Errorf("request log = %v, want status 500 and request_id req-42", requestLog)
	}
}
