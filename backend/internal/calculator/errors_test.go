package calculator

import (
	"errors"
	"fmt"
	"testing"
)

// allErrors lists every domain error, so new ones are covered by both tests below.
var allErrors = []struct {
	name string
	err  error
}{
	{"unknown operation", ErrUnknownOperation},
	{"invalid arity", ErrInvalidArity},
	{"non-finite operand", ErrNonFiniteOperand},
	{"invalid operand", ErrInvalidOperand},
	{"division by zero", ErrDivisionByZero},
	{"result out of range", ErrResultOutOfRange},
}

// The HTTP adapter maps each error to its own (code, status) pair, so no error may match another.
func TestDomainErrorsAreDistinct(t *testing.T) {
	for i, a := range allErrors {
		for j, b := range allErrors {
			if i != j && errors.Is(a.err, b.err) {
				t.Errorf("%s matches %s; domain errors must be distinct", a.name, b.name)
			}
		}
	}
}

// Callers add context with %w; errors.Is must still find the original error.
func TestDomainErrorsSurviveWrapping(t *testing.T) {
	for _, tc := range allErrors {
		t.Run(tc.name, func(t *testing.T) {
			wrapped := fmt.Errorf("calculate: %w", tc.err)
			if !errors.Is(wrapped, tc.err) {
				t.Errorf("errors.Is(%q, %q) = false, want true", wrapped, tc.err)
			}
		})
	}
}
