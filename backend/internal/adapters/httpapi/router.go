// Package httpapi is the HTTP adapter: it turns HTTP requests into use case calls and
// use case results or errors into JSON responses. It holds no business rules.
package httpapi

import (
	"net/http"

	"github.com/gonzalolavin99/sezzle-fullstack-calculator/backend/internal/app"
)

// NewHandler returns the HTTP handler with every route of the API.
// Method-aware patterns (Go 1.22+) make the router answer 405 for a wrong method.
func NewHandler(calc *app.Calculator) http.Handler {
	h := &handlers{calc: calc}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/v1/calculate", h.calculate)
	mux.HandleFunc("GET /api/v1/operations", h.operations)
	mux.HandleFunc("GET /healthz", h.health)
	return mux
}
