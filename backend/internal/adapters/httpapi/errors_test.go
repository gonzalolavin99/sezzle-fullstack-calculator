package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gonzalolavin99/sezzle-fullstack-calculator/backend/internal/calculator"
)

func TestFromDomainError(t *testing.T) {
	tests := []struct {
		name       string
		err        error
		wantStatus int
		wantCode   string
	}{
		{"unknown operation", calculator.ErrUnknownOperation, http.StatusBadRequest, "UNKNOWN_OPERATION"},
		{"invalid arity", calculator.ErrInvalidArity, http.StatusBadRequest, "INVALID_ARITY"},
		{"non-finite operand", calculator.ErrNonFiniteOperand, http.StatusBadRequest, "INVALID_OPERAND"},
		{"division by zero", calculator.ErrDivisionByZero, http.StatusUnprocessableEntity, "DIVISION_BY_ZERO"},
		{"undefined math", calculator.ErrInvalidOperand, http.StatusUnprocessableEntity, "INVALID_OPERAND"},
		{"result out of range", calculator.ErrResultOutOfRange, http.StatusUnprocessableEntity, "RESULT_OUT_OF_RANGE"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// The use case wraps domain errors with context, so map the wrapped form.
			wrapped := fmt.Errorf("divide: %w", tc.err)
			got := fromDomainError(wrapped)
			if got.status != tc.wantStatus || got.code != tc.wantCode {
				t.Errorf("fromDomainError(%v) = %d %s, want %d %s", wrapped, got.status, got.code, tc.wantStatus, tc.wantCode)
			}
			if got.message != wrapped.Error() {
				t.Errorf("message = %q, want the domain message %q", got.message, wrapped.Error())
			}
		})
	}
}

func TestFromDomainErrorHidesUnexpectedErrors(t *testing.T) {
	got := fromDomainError(errors.New("db password=secret at 10.0.0.5"))

	if got.status != http.StatusInternalServerError || got.code != "INTERNAL_ERROR" {
		t.Errorf("got %d %s, want 500 INTERNAL_ERROR", got.status, got.code)
	}
	if strings.Contains(got.message, "secret") {
		t.Errorf("message %q leaks the internal error text", got.message)
	}
}

// End to end through the handler: each domain error reaches the client with its status and code.
func TestCalculateReturnsDomainErrors(t *testing.T) {
	handler := newTestHandler(t)

	tests := []struct {
		name       string
		body       string
		wantStatus int
		wantCode   string
	}{
		{"unknown operation", `{"operation":"modulo","operands":[5,2]}`, http.StatusBadRequest, "UNKNOWN_OPERATION"},
		{"too few operands", `{"operation":"add","operands":[1]}`, http.StatusBadRequest, "INVALID_ARITY"},
		{"empty operands", `{"operation":"add","operands":[]}`, http.StatusBadRequest, "INVALID_ARITY"},
		{"division by zero", `{"operation":"divide","operands":[5,0]}`, http.StatusUnprocessableEntity, "DIVISION_BY_ZERO"},
		{"square root of a negative", `{"operation":"sqrt","operands":[-4]}`, http.StatusUnprocessableEntity, "INVALID_OPERAND"},
		{"overflow", `{"operation":"power","operands":[10,400]}`, http.StatusUnprocessableEntity, "RESULT_OUT_OF_RANGE"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", strings.NewReader(tc.body))
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d (body %s)", rec.Code, tc.wantStatus, rec.Body)
			}
			var got errorResponse
			if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
				t.Fatalf("response is not the error shape: %v (body %s)", err, rec.Body)
			}
			if got.Error.Code != tc.wantCode {
				t.Errorf("code = %q, want %q", got.Error.Code, tc.wantCode)
			}
		})
	}
}
