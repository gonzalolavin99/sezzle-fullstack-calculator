package calculator

import (
	"fmt"
	"math"
)

// checkOperands validates operands before an operation runs: the count must match the
// operation's arity and every value must be finite. This keeps every Apply safe to call
// on its own, without panicking on a short slice.
func checkOperands(op Operation, operands []float64) error {
	if len(operands) != op.Arity() {
		// Callers add the operation name as context, so it is not repeated here.
		return fmt.Errorf("%w: expects %d, got %d", ErrInvalidArity, op.Arity(), len(operands))
	}
	for i, x := range operands {
		if math.IsNaN(x) || math.IsInf(x, 0) {
			return fmt.Errorf("%w: operand %d is %v", ErrNonFiniteOperand, i, x)
		}
	}
	return nil
}

// checkResult is the shared result guard every operation returns through, so no operation
// can return Inf, NaN or -0. Inf means the result overflowed float64; NaN means the math
// is undefined; -0 becomes 0 so clients never see "-0".
func checkResult(x float64) (float64, error) {
	switch {
	case math.IsInf(x, 0):
		return 0, ErrResultOutOfRange
	case math.IsNaN(x):
		return 0, ErrInvalidOperand
	case x == 0:
		return 0, nil
	}
	return x, nil
}
