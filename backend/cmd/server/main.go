// Command server runs the calculator HTTP API.
package main

import (
	"context"
	"errors"
	"fmt"
	"io"
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
	handler := httpapi.Chain(
		httpapi.NewHandler(app.NewCalculator(registry)),
		httpapi.RequestID,
		httpapi.Logging(logger),
		httpapi.Recover(logger),
		httpapi.CORS(cfg.AllowedOrigins),
	)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second, // protects against slow-header (Slowloris) clients
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	ctx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()

	serveErr := make(chan error, 1)
	go func() {
		logger.Info("server starting", "addr", srv.Addr)
		serveErr <- srv.ListenAndServe()
	}()

	select {
	case err := <-serveErr:
		// The server stopped on its own, for example because the port is in use.
		return fmt.Errorf("listen: %w", err)
	case <-ctx.Done():
	}

	logger.Info("shutting down", "timeout", shutdownTimeout.String())
	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return fmt.Errorf("shutdown: %w", err)
	}
	logger.Info("server stopped")
	return nil
}
