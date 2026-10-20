package calculator

import (
	"slices"
	"testing"
)

func TestDefaultOperationsBuildARegistry(t *testing.T) {
	reg, err := NewRegistry(DefaultOperations()...)
	if err != nil {
		t.Fatalf("NewRegistry(DefaultOperations()...) error = %v, want nil", err)
	}

	var names []string
	for _, op := range reg.Operations() {
		names = append(names, op.Name())
	}

	want := []string{"add", "divide", "multiply", "percentage", "power", "sqrt", "subtract"}
	if !slices.Equal(names, want) {
		t.Errorf("default operation names = %v, want %v", names, want)
	}
}
