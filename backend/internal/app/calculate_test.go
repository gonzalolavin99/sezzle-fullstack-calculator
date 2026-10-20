package app

import (
	"errors"
	"slices"
	"testing"

	"github.com/gonzalolavin99/sezzle-fullstack-calculator/backend/internal/calculator"
)

// newTestCalculator uses the real registry: the domain is pure and fast, so no mocks are needed.
func newTestCalculator(t *testing.T) *Calculator {
	t.Helper()
	reg, err := calculator.NewRegistry(calculator.DefaultOperations()...)
	if err != nil {
		t.Fatalf("NewRegistry: %v", err)
	}
	return NewCalculator(reg)
}

func TestCalculate(t *testing.T) {
	calc := newTestCalculator(t)

	tests := []struct {
		name      string
		operation string
		operands  []float64
		want      float64
		wantErr   error
	}{
		{"binary operation", "divide", []float64{10, 4}, 2.5, nil},
		{"unary operation", "sqrt", []float64{144}, 12, nil},
		{"advanced operation", "percentage", []float64{15, 200}, 30, nil},
		{"unknown operation", "modulo", []float64{1, 2}, 0, calculator.ErrUnknownOperation},
		{"empty operation name", "", []float64{1, 2}, 0, calculator.ErrUnknownOperation},
		{"too few operands", "add", []float64{1}, 0, calculator.ErrInvalidArity},
		{"too many operands", "sqrt", []float64{4, 9}, 0, calculator.ErrInvalidArity},
		{"no operands", "multiply", nil, 0, calculator.ErrInvalidArity},
		{"domain error passes through", "divide", []float64{1, 0}, 0, calculator.ErrDivisionByZero},
		{"undefined math", "sqrt", []float64{-4}, 0, calculator.ErrInvalidOperand},
		{"overflow", "power", []float64{10, 400}, 0, calculator.ErrResultOutOfRange},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := calc.Calculate(tc.operation, tc.operands)
			if !errors.Is(err, tc.wantErr) {
				t.Fatalf("Calculate(%q, %v) error = %v, want %v", tc.operation, tc.operands, err, tc.wantErr)
			}
			if tc.wantErr != nil {
				return
			}
			if got.Operation != tc.operation || !slices.Equal(got.Operands, tc.operands) || got.Value != tc.want {
				t.Errorf("Calculate(%q, %v) = %+v, want value %v", tc.operation, tc.operands, got, tc.want)
			}
		})
	}
}

func TestOperations(t *testing.T) {
	calc := newTestCalculator(t)

	want := []OperationInfo{
		{Name: "add", Arity: 2},
		{Name: "divide", Arity: 2},
		{Name: "multiply", Arity: 2},
		{Name: "percentage", Arity: 2},
		{Name: "power", Arity: 2},
		{Name: "sqrt", Arity: 1},
		{Name: "subtract", Arity: 2},
	}
	if got := calc.Operations(); !slices.Equal(got, want) {
		t.Errorf("Operations() = %v, want %v", got, want)
	}
}
