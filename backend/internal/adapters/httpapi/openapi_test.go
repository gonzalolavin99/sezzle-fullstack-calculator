package httpapi

import (
	"os"
	"strings"
	"testing"
)

// The OpenAPI spec is written by hand, so this test keeps it in sync with the code:
// every route and every error code the adapter can return must appear in it.
func TestOpenAPISpecCoversRoutesAndErrorCodes(t *testing.T) {
	raw, err := os.ReadFile("../../../api/openapi.yaml")
	if err != nil {
		t.Fatalf("read spec: %v", err)
	}
	spec := string(raw)

	want := []string{
		"/api/v1/calculate:", "/api/v1/operations:", "/healthz:",
		// Codes written by request validation, the router wrapper and panic recovery.
		"INVALID_REQUEST", "INVALID_OPERAND", "NOT_FOUND", "METHOD_NOT_ALLOWED", "INTERNAL_ERROR",
	}
	for _, m := range domainErrorMapping {
		want = append(want, m.code)
	}

	for _, s := range want {
		if !strings.Contains(spec, s) {
			t.Errorf("openapi.yaml does not mention %q", s)
		}
	}
}
