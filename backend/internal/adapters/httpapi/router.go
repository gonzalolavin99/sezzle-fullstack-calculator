// Package httpapi is the HTTP adapter: it turns HTTP requests into use case calls and
// use case results or errors into JSON responses. It holds no business rules.
package httpapi

import (
	"fmt"
	"net/http"
	"strings"

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
	return jsonRouterErrors(mux)
}

// jsonRouterErrors rewrites the router's plain-text 404 and 405 responses into the API's JSON
// error shape. A catch-all "/" route is not used for 404 because it would match every method
// and hide the router's 405 responses.
func jsonRouterErrors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(&routerErrorWriter{ResponseWriter: w, r: r}, r)
	})
}

// routerErrorWriter intercepts plain-text 404/405 responses written by http.Error.
type routerErrorWriter struct {
	http.ResponseWriter
	r         *http.Request
	rewritten bool
}

func (w *routerErrorWriter) WriteHeader(status int) {
	plainText := !strings.HasPrefix(w.Header().Get("Content-Type"), "application/json")
	switch {
	case status == http.StatusNotFound && plainText:
		w.rewritten = true
		writeError(w.ResponseWriter, status, "NOT_FOUND", "no route for "+w.r.URL.Path)
	case status == http.StatusMethodNotAllowed && plainText:
		w.rewritten = true
		writeError(w.ResponseWriter, status, "METHOD_NOT_ALLOWED",
			fmt.Sprintf("method %s is not allowed for %s", w.r.Method, w.r.URL.Path))
	default:
		w.ResponseWriter.WriteHeader(status)
	}
}

// Write drops the router's plain-text body once the JSON body has been written.
func (w *routerErrorWriter) Write(b []byte) (int, error) {
	if w.rewritten {
		return len(b), nil
	}
	return w.ResponseWriter.Write(b)
}

// Unwrap lets http.ResponseController reach the original ResponseWriter.
func (w *routerErrorWriter) Unwrap() http.ResponseWriter { return w.ResponseWriter }
