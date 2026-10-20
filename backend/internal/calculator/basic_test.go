package calculator

import (
	"errors"
	"math"
	"testing"
)

// Compile-time checks that every basic operation satisfies Operation.
var (
	_ Operation = Add{}
	_ Operation = Subtract{}
	_ Operation = Multiply{}
	_ Operation = Divide{}
)

func TestBasicOperationsMetadata(t *testing.T) {
	tests := []struct {
		op        Operation
		wantName  string
		wantArity int
	}{
		{Add{}, "add", 2},
		{Subtract{}, "subtract", 2},
		{Multiply{}, "multiply", 2},
		{Divide{}, "divide", 2},
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

func TestBasicOperationsApply(t *testing.T) {
	tests := []struct {
		name     string
		op       Operation
		operands []float64
		want     float64
		wantErr  error
	}{
		// add
		{"add integers", Add{}, []float64{2, 3}, 5, nil},
		{"add negatives", Add{}, []float64{-2, -3}, -5, nil},
		{"add zero", Add{}, []float64{7, 0}, 7, nil},
		// float64 cannot represent 0.1 or 0.2 exactly; see ADR 0004.
		{"add decimals", Add{}, []float64{0.1, 0.2}, 0.30000000000000004, nil},
		{"add large numbers", Add{}, []float64{1e300, 1e300}, 2e300, nil},

		// subtract
		{"subtract integers", Subtract{}, []float64{10, 4}, 6, nil},
		{"subtract to negative", Subtract{}, []float64{4, 10}, -6, nil},
		{"subtract negatives", Subtract{}, []float64{-4, -10}, 6, nil},
		{"subtract decimals", Subtract{}, []float64{1.5, 0.25}, 1.25, nil},
		{"subtract large numbers", Subtract{}, []float64{math.MaxFloat64, math.MaxFloat64}, 0, nil},

		// multiply
		{"multiply integers", Multiply{}, []float64{6, 7}, 42, nil},
		{"multiply by zero", Multiply{}, []float64{123.45, 0}, 0, nil},
		{"multiply negatives", Multiply{}, []float64{-3, -4}, 12, nil},
		{"multiply mixed signs", Multiply{}, []float64{-3, 4}, -12, nil},
		{"multiply decimals", Multiply{}, []float64{2.5, 0.4}, 1, nil},
		{"multiply large numbers", Multiply{}, []float64{1e154, 1e154}, 1e308, nil},

		// divide
		{"divide exact", Divide{}, []float64{10, 4}, 2.5, nil},
		{"divide negatives", Divide{}, []float64{-9, 3}, -3, nil},
		{"divide zero by number", Divide{}, []float64{0, 5}, 0, nil},
		{"divide decimals", Divide{}, []float64{1, 0.5}, 2, nil},
		{"divide by zero", Divide{}, []float64{1, 0}, 0, ErrDivisionByZero},
		{"divide zero by zero", Divide{}, []float64{0, 0}, 0, ErrDivisionByZero},
		{"divide by negative zero", Divide{}, []float64{1, math.Copysign(0, -1)}, 0, ErrDivisionByZero},

		// operand checks, shared by every operation
		{"NaN operand", Add{}, []float64{math.NaN(), 1}, 0, ErrNonFiniteOperand},
		{"positive infinity operand", Subtract{}, []float64{1, math.Inf(1)}, 0, ErrNonFiniteOperand},
		{"negative infinity operand", Multiply{}, []float64{math.Inf(-1), 2}, 0, ErrNonFiniteOperand},
		{"NaN divisor", Divide{}, []float64{1, math.NaN()}, 0, ErrNonFiniteOperand},
		{"too few operands", Add{}, []float64{1}, 0, ErrInvalidArity},
		{"too many operands", Divide{}, []float64{1, 2, 3}, 0, ErrInvalidArity},
		{"no operands", Multiply{}, nil, 0, ErrInvalidArity},
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
