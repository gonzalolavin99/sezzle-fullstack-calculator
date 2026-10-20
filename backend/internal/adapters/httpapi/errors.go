package httpapi

import (
	"errors"
	"net/http"

	"github.com/gonzalolavin99/sezzle-fullstack-calculator/backend/internal/calculator"
)

// domainErrorMapping is the error table from docs/PROJECT_PLAN.md section 3, as data.
// 400 means the request itself is invalid; 422 means it is well formed but the math is not possible.
var domainErrorMapping = []struct {
	err    error
	status int
	code   string
}{
	{calculator.ErrUnknownOperation, http.StatusBadRequest, "UNKNOWN_OPERATION"},
	{calculator.ErrInvalidArity, http.StatusBadRequest, "INVALID_ARITY"},
	{calculator.ErrNonFiniteOperand, http.StatusBadRequest, "INVALID_OPERAND"},
	{calculator.ErrDivisionByZero, http.StatusUnprocessableEntity, "DIVISION_BY_ZERO"},
	{calculator.ErrInvalidOperand, http.StatusUnprocessableEntity, "INVALID_OPERAND"},
	{calculator.ErrResultOutOfRange, http.StatusUnprocessableEntity, "RESULT_OUT_OF_RANGE"},
}

// fromDomainError maps an error from the use case to an API error. Domain messages are safe
// to show; any other error becomes a generic 500 so internal details never reach the client.
func fromDomainError(err error) *apiError {
	for _, m := range domainErrorMapping {
		if errors.Is(err, m.err) {
			return &apiError{status: m.status, code: m.code, message: err.Error()}
		}
	}
	return &apiError{status: http.StatusInternalServerError, code: "INTERNAL_ERROR", message: "unexpected error"}
}
