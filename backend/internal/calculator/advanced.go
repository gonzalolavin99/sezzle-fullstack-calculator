package calculator

import "math"

// Power returns a raised to b.
// A negative base with a fractional exponent has no real result (ErrInvalidOperand),
// and zero to a negative exponent is a division by zero (ErrDivisionByZero).
type Power struct{}

func (Power) Name() string { return "power" }
func (Power) Arity() int   { return 2 }

func (o Power) Apply(operands []float64) (float64, error) {
	if err := checkOperands(o, operands); err != nil {
		return 0, err
	}
	base, exponent := operands[0], operands[1]
	if base < 0 && exponent != math.Trunc(exponent) {
		return 0, ErrInvalidOperand
	}
	if base == 0 && exponent < 0 {
		return 0, ErrDivisionByZero
	}
	return math.Pow(base, exponent), nil
}

// Sqrt returns the square root of a. Negative numbers return ErrInvalidOperand.
type Sqrt struct{}

func (Sqrt) Name() string { return "sqrt" }
func (Sqrt) Arity() int   { return 1 }

func (o Sqrt) Apply(operands []float64) (float64, error) {
	if err := checkOperands(o, operands); err != nil {
		return 0, err
	}
	if operands[0] < 0 {
		return 0, ErrInvalidOperand
	}
	return math.Sqrt(operands[0]), nil
}

// Percentage returns a percent of b, for example 15% of 200 = 30.
type Percentage struct{}

func (Percentage) Name() string { return "percentage" }
func (Percentage) Arity() int   { return 2 }

func (o Percentage) Apply(operands []float64) (float64, error) {
	if err := checkOperands(o, operands); err != nil {
		return 0, err
	}
	// Divide first: a * b could overflow to Inf even when the final result fits in a float64.
	return operands[0] / 100 * operands[1], nil
}
