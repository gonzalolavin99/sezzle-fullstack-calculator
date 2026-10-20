package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCalculateRejectsInvalidRequests(t *testing.T) {
	handler := newTestHandler(t)

	tests := []struct {
		name     string
		body     string
		wantCode string
	}{
		// Malformed bodies
		{"invalid JSON", `{"operation":`, "INVALID_REQUEST"},
		{"empty body", ``, "INVALID_REQUEST"},
		{"two JSON objects", `{"operation":"add","operands":[1,2]}{}`, "INVALID_REQUEST"},
		{"top-level array", `[1,2]`, "INVALID_REQUEST"},
		{"unknown field", `{"operation":"add","operands":[1,2],"extra":true}`, "INVALID_REQUEST"},
		{"body too large", `{"operation":"add","operands":[1,2],"pad":"` + strings.Repeat("x", maxBodyBytes) + `"}`, "INVALID_REQUEST"},

		// Required fields and types
		{"missing operation", `{"operands":[1,2]}`, "INVALID_REQUEST"},
		{"missing operands", `{"operation":"add"}`, "INVALID_REQUEST"},
		{"null operands", `{"operation":"add","operands":null}`, "INVALID_REQUEST"},
		{"operation is not a string", `{"operation":123,"operands":[1,2]}`, "INVALID_REQUEST"},
		{"operands is not an array", `{"operation":"add","operands":"1,2"}`, "INVALID_REQUEST"},

		// Operand values
		{"null operand", `{"operation":"divide","operands":[1,null]}`, "INVALID_OPERAND"},
		{"string operand", `{"operation":"add","operands":["1",2]}`, "INVALID_OPERAND"},
		{"operand too large for float64", `{"operation":"add","operands":[1e999,2]}`, "INVALID_OPERAND"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", strings.NewReader(tc.body))
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want %d (body %s)", rec.Code, http.StatusBadRequest, rec.Body)
			}
			var got errorResponse
			if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
				t.Fatalf("response is not the error shape: %v (body %s)", err, rec.Body)
			}
			if got.Error.Code != tc.wantCode {
				t.Errorf("code = %q, want %q (message %q)", got.Error.Code, tc.wantCode, got.Error.Message)
			}
			if got.Error.Message == "" {
				t.Error("message is empty, want a human-readable message")
			}
		})
	}
}
