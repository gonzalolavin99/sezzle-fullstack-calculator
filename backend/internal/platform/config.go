// Package platform holds process-level concerns: configuration and logging.
package platform

import (
	"fmt"
	"log/slog"
	"strconv"
	"strings"
)

// Config is the service configuration, read from environment variables.
type Config struct {
	// Port is the TCP port to listen on. "0" picks any free port (used in tests).
	Port string
	// AllowedOrigins are the browser origins allowed by CORS (local development).
	AllowedOrigins []string
	// LogLevel is the minimum level written to the logs.
	LogLevel slog.Level
}

// LoadConfig reads PORT, ALLOWED_ORIGINS (comma-separated) and LOG_LEVEL through getenv,
// applying safe defaults. Invalid values return an error so the service fails fast at startup.
// getenv is a parameter (os.Getenv in production) so tests never touch the real environment.
func LoadConfig(getenv func(string) string) (Config, error) {
	cfg := Config{
		Port:           valueOr(getenv("PORT"), "8080"),
		AllowedOrigins: splitList(valueOr(getenv("ALLOWED_ORIGINS"), "http://localhost:5173")),
	}

	port, err := strconv.Atoi(cfg.Port)
	if err != nil || port < 0 || port > 65535 {
		return Config{}, fmt.Errorf("PORT must be a number from 0 to 65535, got %q", cfg.Port)
	}

	level := valueOr(getenv("LOG_LEVEL"), "info")
	if err := cfg.LogLevel.UnmarshalText([]byte(level)); err != nil {
		return Config{}, fmt.Errorf("LOG_LEVEL must be debug, info, warn or error, got %q", level)
	}

	return cfg, nil
}

func valueOr(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func splitList(s string) []string {
	var items []string
	for _, item := range strings.Split(s, ",") {
		if item = strings.TrimSpace(item); item != "" {
			items = append(items, item)
		}
	}
	return items
}
