package calculator

// DefaultOperations returns every operation the service offers.
// Adding a new operation means adding one line here (plus its type and tests).
func DefaultOperations() []Operation {
	return []Operation{
		Add{},
		Subtract{},
		Multiply{},
		Divide{},
		Power{},
		Sqrt{},
		Percentage{},
	}
}
