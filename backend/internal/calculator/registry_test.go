package calculator

import (
	"errors"
	"slices"
	"testing"
)

// stubOp is a minimal Operation used to test the registry before real operations exist.
type stubOp struct {
	name  string
	arity int
}

func (s stubOp) Name() string                              { return s.name }
func (s stubOp) Arity() int                                { return s.arity }
func (s stubOp) Apply(operands []float64) (float64, error) { return 0, nil }

// Compile-time check that stubOp satisfies Operation.
var _ Operation = stubOp{}

func TestNewRegistryRejectsDuplicateNames(t *testing.T) {
	_, err := NewRegistry(stubOp{name: "add", arity: 2}, stubOp{name: "add", arity: 2})
	if err == nil {
		t.Fatal("NewRegistry with a duplicate name returned nil error, want an error")
	}
}

func TestRegistryLookup(t *testing.T) {
	reg, err := NewRegistry(stubOp{name: "add", arity: 2}, stubOp{name: "sqrt", arity: 1})
	if err != nil {
		t.Fatalf("NewRegistry: %v", err)
	}

	tests := []struct {
		name      string
		lookup    string
		wantArity int
		wantErr   error
	}{
		{"binary operation", "add", 2, nil},
		{"unary operation", "sqrt", 1, nil},
		{"unknown name", "modulo", 0, ErrUnknownOperation},
		{"empty name", "", 0, ErrUnknownOperation},
		{"names are case-sensitive", "ADD", 0, ErrUnknownOperation},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			op, err := reg.Lookup(tc.lookup)
			if !errors.Is(err, tc.wantErr) {
				t.Fatalf("Lookup(%q) error = %v, want %v", tc.lookup, err, tc.wantErr)
			}
			if tc.wantErr != nil {
				return
			}
			if op.Name() != tc.lookup || op.Arity() != tc.wantArity {
				t.Errorf("Lookup(%q) = %s/%d, want %s/%d", tc.lookup, op.Name(), op.Arity(), tc.lookup, tc.wantArity)
			}
		})
	}
}

func TestRegistryOperationsAreSortedByName(t *testing.T) {
	reg, err := NewRegistry(
		stubOp{name: "subtract", arity: 2},
		stubOp{name: "add", arity: 2},
		stubOp{name: "multiply", arity: 2},
	)
	if err != nil {
		t.Fatalf("NewRegistry: %v", err)
	}

	var got []string
	for _, op := range reg.Operations() {
		got = append(got, op.Name())
	}

	want := []string{"add", "multiply", "subtract"}
	if !slices.Equal(got, want) {
		t.Errorf("Operations() names = %v, want %v", got, want)
	}
}
