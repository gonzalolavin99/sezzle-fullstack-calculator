// Package app holds the application use cases. It sits between the transport adapters
// (HTTP today) and the calculator domain, so every adapter shares the same behavior.
package app

import (
	"fmt"

	"github.com/gonzalolavin99/sezzle-fullstack-calculator/backend/internal/calculator"
)

// Calculator runs calculator operations by name.
type Calculator struct {
	registry *calculator.Registry
}

// NewCalculator returns a Calculator backed by the given registry.
func NewCalculator(registry *calculator.Registry) *Calculator {
	return &Calculator{registry: registry}
}

// Result is the outcome of one successful calculation.
type Result struct {
	Operation string
	Operands  []float64
	Value     float64
}

// OperationInfo describes an available operation, for clients that list them.
type OperationInfo struct {
	Name  string
	Arity int
}

// Calculate looks up the operation and applies it. Errors are domain errors from the
// calculator package (wrapped with context), so callers can check them with errors.Is.
// Arity and operand checks happen inside each operation's Apply, in one place.
func (c *Calculator) Calculate(operation string, operands []float64) (Result, error) {
	op, err := c.registry.Lookup(operation)
	if err != nil {
		return Result{}, err
	}
	value, err := op.Apply(operands)
	if err != nil {
		return Result{}, fmt.Errorf("%s: %w", operation, err)
	}
	return Result{Operation: operation, Operands: operands, Value: value}, nil
}

// Operations lists the available operations, sorted by name.
func (c *Calculator) Operations() []OperationInfo {
	ops := c.registry.Operations()
	infos := make([]OperationInfo, 0, len(ops))
	for _, op := range ops {
		infos = append(infos, OperationInfo{Name: op.Name(), Arity: op.Arity()})
	}
	return infos
}
