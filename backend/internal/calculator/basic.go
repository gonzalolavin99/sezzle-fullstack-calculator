package calculator

// Add returns a + b.
type Add struct{}

func (Add) Name() string { return "add" }
func (Add) Arity() int   { return 2 }

func (o Add) Apply(operands []float64) (float64, error) {
	if err := checkOperands(o, operands); err != nil {
		return 0, err
	}
	return checkResult(operands[0] + operands[1])
}

// Subtract returns a - b.
type Subtract struct{}

func (Subtract) Name() string { return "subtract" }
func (Subtract) Arity() int   { return 2 }

func (o Subtract) Apply(operands []float64) (float64, error) {
	if err := checkOperands(o, operands); err != nil {
		return 0, err
	}
	return checkResult(operands[0] - operands[1])
}

// Multiply returns a × b.
type Multiply struct{}

func (Multiply) Name() string { return "multiply" }
func (Multiply) Arity() int   { return 2 }

func (o Multiply) Apply(operands []float64) (float64, error) {
	if err := checkOperands(o, operands); err != nil {
		return 0, err
	}
	return checkResult(operands[0] * operands[1])
}

// Divide returns a ÷ b. Dividing by zero (including -0) returns ErrDivisionByZero.
type Divide struct{}

func (Divide) Name() string { return "divide" }
func (Divide) Arity() int   { return 2 }

func (o Divide) Apply(operands []float64) (float64, error) {
	if err := checkOperands(o, operands); err != nil {
		return 0, err
	}
	if operands[1] == 0 {
		return 0, ErrDivisionByZero
	}
	return checkResult(operands[0] / operands[1])
}
