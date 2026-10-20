package calculator

import (
	"errors"
	"math"
	"testing"
)

// Compile-time checks that every advanced operation satisfies Operation.
var (
	_ Operation = Power{}
	_ Operation = Sqrt{}
	_ Operation = Percentage{}
)

func TestAdvancedOperationsMetadata(t *testing.T) {
	tests := []struct {
		op        Operation
		wantName  string
		wantArity int
	}{
		{Power{}, "power", 2},
		{Sqrt{}, "sqrt", 1},
		{Percentage{}, "percentage", 2},
	}

	for _, tc := range tests {
		t.Run(tc.wantName, func(t *testing.T) {
			if got := tc.op.Name(); got != tc.wantName {
				t.Errorf("Name() = %q, want %q", got, tc.wantName)
			}
			if got := tc.op.Arity(); got != tc.wantArity {
				t.Errorf("Arity() = %d, want %d", got, tc.wantArity)
			}
		})
	}
}

func TestAdvancedOperationsApply(t *testing.T) {
	tests := []struct {
		name     string
		op       Operation
		operands []float64
		want     float64
		wantErr  error
	}{
		// power: a^b
		{"power integers", Power{}, []float64{2, 10}, 1024, nil},
		{"power zero exponent", Power{}, []float64{5, 0}, 1, nil},
		{"power zero to zero", Power{}, []float64{0, 0}, 1, nil},
		{"power negative exponent", Power{}, []float64{2, -1}, 0.5, nil},
		{"power fractional exponent", Power{}, []float64{9, 0.5}, 3, nil},
		{"power negative base, integer exponent", Power{}, []float64{-2, 3}, -8, nil},
		{"power negative base, even exponent", Power{}, []float64{-3, 2}, 9, nil},
		{"power negative base, fractional exponent", Power{}, []float64{-8, 1.0 / 3}, 0, ErrInvalidOperand},
		{"power zero to negative exponent", Power{}, []float64{0, -1}, 0, ErrDivisionByZero},

		// sqrt: √a
		{"sqrt perfect square", Sqrt{}, []float64{144}, 12, nil},
		{"sqrt zero", Sqrt{}, []float64{0}, 0, nil},
		{"sqrt decimal", Sqrt{}, []float64{0.25}, 0.5, nil},
		{"sqrt large number", Sqrt{}, []float64{1e300}, 1e150, nil},
		{"sqrt negative", Sqrt{}, []float64{-4}, 0, ErrInvalidOperand},

		// percentage: a% of b = a / 100 * b
		{"percentage simple", Percentage{}, []float64{15, 200}, 30, nil},
		{"percentage decimal", Percentage{}, []float64{12.5, 80}, 10, nil},
		{"percentage of zero", Percentage{}, []float64{50, 0}, 0, nil},
		{"percentage negative", Percentage{}, []float64{-10, 50}, -5, nil},
		{"percentage over one hundred", Percentage{}, []float64{150, 40}, 60, nil},
		// a * b would overflow to Inf before dividing; a / 100 * b stays finite.
		{"percentage of a very large number", Percentage{}, []float64{50, 1e308}, 5e307, nil},

		// shared operand checks
		{"sqrt with two operands", Sqrt{}, []float64{4, 9}, 0, ErrInvalidArity},
		{"power with one operand", Power{}, []float64{2}, 0, ErrInvalidArity},
		{"sqrt of NaN", Sqrt{}, []float64{math.NaN()}, 0, ErrNonFiniteOperand},
		{"percentage of infinity", Percentage{}, []float64{10, math.Inf(1)}, 0, ErrNonFiniteOperand},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := tc.op.Apply(tc.operands)
			if !errors.Is(err, tc.wantErr) {
				t.Fatalf("Apply(%v) error = %v, want %v", tc.operands, err, tc.wantErr)
			}
			if tc.wantErr == nil && got != tc.want {
				t.Errorf("Apply(%v) = %v, want %v", tc.operands, got, tc.want)
			}
		})
	}
}
