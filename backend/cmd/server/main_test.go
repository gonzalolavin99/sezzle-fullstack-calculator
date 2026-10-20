package main

import (
	"bytes"
	"context"
	"strings"
	"testing"
	"time"
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
func TestRunShutsDownWhenContextIsCancelled(t *testing.T) {
	getenv := func(key string) string {
		if key == "PORT" {
			return "0" // any free port
		}
		return ""
	}
	var logs bytes.Buffer
	ctx, cancel := context.WithCancel(context.Background())

	done := make(chan error, 1)
	go func() { done <- run(ctx, getenv, &logs) }()

	time.Sleep(100 * time.Millisecond) // let the server start
	cancel()

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
