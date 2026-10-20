package platform

import (
	"io"
	"log/slog"
)

// NewLogger returns a JSON logger that writes entries at level or above to w.
func NewLogger(w io.Writer, level slog.Level) *slog.Logger {
	return slog.New(slog.NewJSONHandler(w, &slog.HandlerOptions{Level: level}))
}
