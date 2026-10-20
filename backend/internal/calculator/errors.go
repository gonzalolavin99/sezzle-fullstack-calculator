// Package calculator is the domain layer: operations, the operation registry and domain errors.
// It has no knowledge of HTTP, JSON or logging.
package calculator

import "errors"

// Domain errors. Operations return them (optionally wrapped with %w) and callers check them
// with errors.Is. The HTTP adapter maps each one to a status code and an API error code.
var (
	// ErrUnknownOperation means no operation is registered under the requested name.
	ErrUnknownOperation = errors.New("unknown operation")

	// ErrInvalidArity means the number of operands does not match what the operation expects.
	ErrInvalidArity = errors.New("wrong number of operands")

	// ErrNonFiniteOperand means an operand is NaN or infinite, so the input itself is invalid.
	ErrNonFiniteOperand = errors.New("operand must be a finite number")

	// ErrInvalidOperand means the operands are valid numbers but the math is undefined for them,
	// for example the square root of a negative number.
	ErrInvalidOperand = errors.New("operation is undefined for these operands")

	// ErrDivisionByZero means the divisor is zero.
	ErrDivisionByZero = errors.New("cannot divide by zero")

	// ErrResultOutOfRange means the result does not fit in a finite float64.
	ErrResultOutOfRange = errors.New("result is out of range")
)
