package httpapi

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gonzalolavin99/sezzle-fullstack-calculator/backend/internal/app"
	"github.com/gonzalolavin99/sezzle-fullstack-calculator/backend/internal/calculator"
)

// newTestHandler wires the real domain and use case, like main.go will.
func newTestHandler(t *testing.T) http.Handler {
	t.Helper()
	reg, err := calculator.NewRegistry(calculator.DefaultOperations()...)
	if err != nil {
		t.Fatalf("NewRegistry: %v", err)
	}
	return NewHandler(app.NewCalculator(reg))
}

func TestRoutes(t *testing.T) {
	handler := newTestHandler(t)

	tests := []struct {
		name       string
		method     string
		path       string
		body       string
		wantStatus int
		wantBody   string
	}{
		{
			name: "health check", method: http.MethodGet, path: "/healthz",
			wantStatus: http.StatusOK, wantBody: `{"status":"ok"}`,
		},
		{
			name: "list operations", method: http.MethodGet, path: "/api/v1/operations",
			wantStatus: http.StatusOK,
			wantBody: `{"operations":[{"name":"add","arity":2},{"name":"divide","arity":2},` +
				`{"name":"multiply","arity":2},{"name":"percentage","arity":2},{"name":"power","arity":2},` +
				`{"name":"sqrt","arity":1},{"name":"subtract","arity":2}]}`,
		},
		{
			name: "calculate binary operation", method: http.MethodPost, path: "/api/v1/calculate",
			body:       `{"operation":"divide","operands":[10,4]}`,
			wantStatus: http.StatusOK, wantBody: `{"operation":"divide","operands":[10,4],"result":2.5}`,
		},
		{
			name: "calculate unary operation", method: http.MethodPost, path: "/api/v1/calculate",
			body:       `{"operation":"sqrt","operands":[144]}`,
			wantStatus: http.StatusOK, wantBody: `{"operation":"sqrt","operands":[144],"result":12}`,
		},
		{
			name: "decimal result keeps full precision", method: http.MethodPost, path: "/api/v1/calculate",
			body:       `{"operation":"add","operands":[0.1,0.2]}`,
			wantStatus: http.StatusOK, wantBody: `{"operation":"add","operands":[0.1,0.2],"result":0.30000000000000004}`,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, tc.path, strings.NewReader(tc.body))
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d (body %s)", rec.Code, tc.wantStatus, rec.Body)
			}
			if got := rec.Header().Get("Content-Type"); got != "application/json" {
				t.Errorf("Content-Type = %q, want application/json", got)
			}
			if got := strings.TrimSpace(rec.Body.String()); got != tc.wantBody {
				t.Errorf("body = %s\nwant   %s", got, tc.wantBody)
			}
		})
	}
}

// The router's own 404 and 405 responses are plain text; the API rewrites them as JSON
// so every response has the same shape. 405 keeps its Allow header.
func TestRouterErrorsAreJSON(t *testing.T) {
	handler := newTestHandler(t)

	tests := []struct {
		name       string
		method     string
		path       string
		wantStatus int
		wantBody   string
		wantAllow  string
	}{
		{
			name: "wrong method", method: http.MethodGet, path: "/api/v1/calculate",
			wantStatus: http.StatusMethodNotAllowed, wantAllow: "POST",
			wantBody: `{"error":{"code":"METHOD_NOT_ALLOWED","message":"method GET is not allowed for /api/v1/calculate"}}`,
		},
		{
			name: "unknown path", method: http.MethodGet, path: "/api/v1/nope",
			wantStatus: http.StatusNotFound,
			wantBody:   `{"error":{"code":"NOT_FOUND","message":"no route for /api/v1/nope"}}`,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, httptest.NewRequest(tc.method, tc.path, nil))

			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d", rec.Code, tc.wantStatus)
			}
			if got := rec.Header().Get("Content-Type"); got != "application/json" {
				t.Errorf("Content-Type = %q, want application/json", got)
			}
			if got := strings.TrimSpace(rec.Body.String()); got != tc.wantBody {
				t.Errorf("body = %s\nwant   %s", got, tc.wantBody)
			}
			if got := rec.Header().Get("Allow"); got != tc.wantAllow {
				t.Errorf("Allow = %q, want %q", got, tc.wantAllow)
			}
		})
	}
}

// The use case adds the operation name, so the domain message must not repeat it.
func TestArityErrorMessageNamesTheOperationOnce(t *testing.T) {
	handler := newTestHandler(t)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", strings.NewReader(`{"operation":"add","operands":[1]}`))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	want := `{"error":{"code":"INVALID_ARITY","message":"add: wrong number of operands: expects 2, got 1"}}`
	if got := strings.TrimSpace(rec.Body.String()); got != want {
		t.Errorf("body = %s\nwant   %s", got, want)
	}
}
