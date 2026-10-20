package httpapi

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
)

func TestChainRunsMiddlewareInOrder(t *testing.T) {
	var calls []string
	mark := func(name string) Middleware {
		return func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				calls = append(calls, name)
				next.ServeHTTP(w, r)
			})
		}
	}
	final := http.HandlerFunc(func(http.ResponseWriter, *http.Request) { calls = append(calls, "handler") })

	Chain(final, mark("first"), mark("second")).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/", nil))

	if got := strings.Join(calls, ","); got != "first,second,handler" {
		t.Errorf("call order = %s, want first,second,handler", got)
	}
}

func TestRequestID(t *testing.T) {
	generated := regexp.MustCompile(`^[0-9a-f]{32}$`)

	tests := []struct {
		name     string
		incoming string
		wantSame bool
	}{
		{"generated when missing", "", false},
		{"client value is kept when safe", "abc-123_XYZ", true},
		{"value with a newline is replaced", "abc\ninjected", false},
		{"value that is too long is replaced", strings.Repeat("a", 65), false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var seenInContext string
			handler := RequestID(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
				seenInContext = RequestIDFrom(r.Context())
			}))

			req := httptest.NewRequest(http.MethodGet, "/", nil)
			if tc.incoming != "" {
				req.Header.Set("X-Request-ID", tc.incoming)
			}
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			got := rec.Header().Get("X-Request-ID")
			if got != seenInContext {
				t.Errorf("header %q and context %q differ", got, seenInContext)
			}
			if tc.wantSame && got != tc.incoming {
				t.Errorf("request ID = %q, want the client value %q", got, tc.incoming)
			}
			if !tc.wantSame && !generated.MatchString(got) {
				t.Errorf("request ID = %q, want 32 generated hex characters", got)
			}
		})
	}
}

func TestLoggingWritesOneStructuredLine(t *testing.T) {
	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, nil))
	handler := RequestID(Logging(logger)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusTeapot)
	})))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", nil)
	req.Header.Set("X-Request-ID", "req-1")
	handler.ServeHTTP(httptest.NewRecorder(), req)

	var entry map[string]any
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("log is not one JSON line: %v (%q)", err, buf.String())
	}
	want := map[string]any{"msg": "request", "method": "POST", "path": "/api/v1/calculate", "status": float64(418), "request_id": "req-1"}
	for key, value := range want {
		if entry[key] != value {
			t.Errorf("log %s = %v, want %v", key, entry[key], value)
		}
	}
	if _, ok := entry["duration_ms"]; !ok {
		t.Error("log has no duration_ms")
	}
}

func TestRecoverTurnsPanicIntoInternalError(t *testing.T) {
	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, nil))
	handler := Recover(logger)(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		panic("boom")
	}))

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), `"code":"INTERNAL_ERROR"`) {
		t.Errorf("body = %s, want the INTERNAL_ERROR shape", rec.Body)
	}
	if strings.Contains(rec.Body.String(), "boom") {
		t.Error("response leaks the panic value")
	}
	if !strings.Contains(buf.String(), "panic recovered") || !strings.Contains(buf.String(), "boom") {
		t.Errorf("log = %q, want the recovered panic", buf.String())
	}
}

func TestCORS(t *testing.T) {
	const allowed = "http://localhost:5173"
	handler := CORS([]string{allowed})(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	tests := []struct {
		name        string
		method      string
		origin      string
		preflight   bool
		wantStatus  int
		wantAllowed bool
	}{
		{"allowed origin", http.MethodPost, allowed, false, http.StatusOK, true},
		{"other origin", http.MethodPost, "http://evil.example", false, http.StatusOK, false},
		{"no origin (same site or curl)", http.MethodGet, "", false, http.StatusOK, false},
		{"preflight from allowed origin", http.MethodOptions, allowed, true, http.StatusNoContent, true},
		{"preflight from other origin", http.MethodOptions, "http://evil.example", true, http.StatusNoContent, false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, "/api/v1/calculate", nil)
			if tc.origin != "" {
				req.Header.Set("Origin", tc.origin)
			}
			if tc.preflight {
				req.Header.Set("Access-Control-Request-Method", http.MethodPost)
			}
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != tc.wantStatus {
				t.Errorf("status = %d, want %d", rec.Code, tc.wantStatus)
			}
			gotAllowed := rec.Header().Get("Access-Control-Allow-Origin") == tc.origin && tc.origin != ""
			if gotAllowed != tc.wantAllowed {
				t.Errorf("Access-Control-Allow-Origin = %q, want allowed=%v", rec.Header().Get("Access-Control-Allow-Origin"), tc.wantAllowed)
			}
			if tc.preflight && tc.wantAllowed && rec.Header().Get("Access-Control-Allow-Methods") == "" {
				t.Error("preflight response has no Access-Control-Allow-Methods")
			}
		})
	}
}
