package calculator

// Operation is one calculator operation, such as "add" or "sqrt".
// Adding a new operation means implementing this interface and registering it.
type Operation interface {
	// Name is the stable identifier used by the API, for example "divide".
	Name() string
	// Arity is the number of operands the operation expects: 1 for sqrt, 2 for add.
	Arity() int
	// Apply runs the operation. It returns ErrInvalidArity if len(operands) != Arity().
	Apply(operands []float64) (float64, error)
}
