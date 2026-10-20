package calculator

import (
	"errors"
	"math"
	"testing"
)

// Every operation must reject non-finite results, even when all operands are finite.
func TestOperationsRejectOverflow(t *testing.T) {
	tests := []struct {
		name     string
		op       Operation
		operands []float64
	}{
		{"add", Add{}, []float64{math.MaxFloat64, math.MaxFloat64}},
		{"subtract", Subtract{}, []float64{-math.MaxFloat64, math.MaxFloat64}},
		{"multiply", Multiply{}, []float64{1e308, 10}},
		{"divide by a tiny number", Divide{}, []float64{1e308, 1e-10}},
		{"power", Power{}, []float64{10, 400}},
		{"percentage", Percentage{}, []float64{1e308, 1e308}},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := tc.op.Apply(tc.operands)
			if !errors.Is(err, ErrResultOutOfRange) {
				t.Fatalf("Apply(%v) = %v, %v; want ErrResultOutOfRange", tc.operands, got, err)
			}
		})
	}
}

// -0 == 0 in Go, so the sign bit is checked explicitly; JSON would otherwise print "-0".
func TestOperationsNeverReturnNegativeZero(t *testing.T) {
	tests := []struct {
		name     string
		op       Operation
		operands []float64
	}{
		{"multiply negative by zero", Multiply{}, []float64{-1, 0}},
		{"divide zero by negative", Divide{}, []float64{0, -5}},
		{"sqrt of negative zero", Sqrt{}, []float64{math.Copysign(0, -1)}},
		{"percentage of zero, negative", Percentage{}, []float64{-10, 0}},
		{"add negative zeros", Add{}, []float64{math.Copysign(0, -1), math.Copysign(0, -1)}},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := tc.op.Apply(tc.operands)
			if err != nil {
				t.Fatalf("Apply(%v) error = %v, want nil", tc.operands, err)
			}
			if got != 0 || math.Signbit(got) {
				t.Errorf("Apply(%v) = %v (sign bit %v), want positive 0", tc.operands, got, math.Signbit(got))
			}
		})
	}
}

// Direct test of the guard, including NaN, which no operation can produce with finite inputs today.
func TestCheckResult(t *testing.T) {
	tests := []struct {
		name    string
		in      float64
		want    float64
		wantErr error
	}{
		{"finite value passes through", 2.5, 2.5, nil},
		{"tiny value passes through", 5e-324, 5e-324, nil},
		{"negative zero becomes zero", math.Copysign(0, -1), 0, nil},
		{"positive infinity", math.Inf(1), 0, ErrResultOutOfRange},
		{"negative infinity", math.Inf(-1), 0, ErrResultOutOfRange},
		{"NaN means undefined math", math.NaN(), 0, ErrInvalidOperand},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := checkResult(tc.in)
			if !errors.Is(err, tc.wantErr) {
				t.Fatalf("checkResult(%v) error = %v, want %v", tc.in, err, tc.wantErr)
			}
			if tc.wantErr == nil && (got != tc.want || math.Signbit(got) != math.Signbit(tc.want)) {
				t.Errorf("checkResult(%v) = %v, want %v", tc.in, got, tc.want)
			}
		})
	}
}
