// Command server runs the calculator HTTP API.
package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gonzalolavin99/sezzle-fullstack-calculator/backend/internal/adapters/httpapi"
	"github.com/gonzalolavin99/sezzle-fullstack-calculator/backend/internal/app"
	"github.com/gonzalolavin99/sezzle-fullstack-calculator/backend/internal/calculator"
	"github.com/gonzalolavin99/sezzle-fullstack-calculator/backend/internal/platform"
)

// shutdownTimeout is how long in-flight requests get to finish after SIGTERM.
const shutdownTimeout = 10 * time.Second

func main() {
	if err := run(context.Background(), os.Getenv, os.Stdout); err != nil {
		fmt.Fprintln(os.Stderr, "server error:", err)
		os.Exit(1)
	}
}

// run wires the service and serves until ctx is cancelled or SIGINT/SIGTERM arrives.
// Its dependencies are parameters so tests can run it with a fake environment.
func run(ctx context.Context, getenv func(string) string, logOutput io.Writer) error {
	cfg, err := platform.LoadConfig(getenv)
	if err != nil {
		return err
	}
	logger := platform.NewLogger(logOutput, cfg.LogLevel)

	registry, err := calculator.NewRegistry(calculator.DefaultOperations()...)
	if err != nil {
		return err
	}
	routes := httpapi.NewHandler(app.NewCalculator(registry))

	srv := &http.Server{
		Handler:           withMiddleware(routes, cfg, logger),
		ReadHeaderTimeout: 5 * time.Second, // protects against slow-header (Slowloris) clients
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// Listen before starting the goroutine: a busy port fails here, synchronously,
	// and the log shows the real address (useful with PORT=0).
	ln, err := net.Listen("tcp", ":"+cfg.Port)
	if err != nil {
		return fmt.Errorf("listen: %w", err)
	}
	logger.Info("server starting", "addr", ln.Addr().String())

	ctx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()

	serveErr := make(chan error, 1)
	go func() { serveErr <- srv.Serve(ln) }()

	select {
	case err := <-serveErr:
		// Serve only returns early on a real failure.
		return fmt.Errorf("serve: %w", err)
	case <-ctx.Done():
	}

	logger.Info("shutting down", "timeout", shutdownTimeout.String())
	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("shutdown: %w", err)
	}
	// Wait for the serve goroutine; after Shutdown, Serve returns http.ErrServerClosed.
	if err := <-serveErr; !errors.Is(err, http.ErrServerClosed) {
		return fmt.Errorf("serve: %w", err)
	}
	logger.Info("server stopped")
	return nil
}

// withMiddleware wraps the routes in the production middleware, outermost first:
// RequestID (every log line gets the ID), Logging (sees the final status, including the
// 500 written by Recover), Recover, then CORS (headers also on error responses).
func withMiddleware(routes http.Handler, cfg platform.Config, logger *slog.Logger) http.Handler {
	return httpapi.Chain(routes,
		httpapi.RequestID,
		httpapi.Logging(logger),
		httpapi.Recover(logger),
		httpapi.CORS(cfg.AllowedOrigins),
	)
}
