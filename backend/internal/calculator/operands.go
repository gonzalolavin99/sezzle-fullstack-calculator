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
		return fmt.Errorf("%w: %s expects %d, got %d", ErrInvalidArity, op.Name(), op.Arity(), len(operands))
	}
	for i, x := range operands {
		if math.IsNaN(x) || math.IsInf(x, 0) {
			return fmt.Errorf("%w: operand %d is %v", ErrNonFiniteOperand, i, x)
		}
	}
	return nil
}
