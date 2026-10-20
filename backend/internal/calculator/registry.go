package calculator

import (
	"fmt"
	"maps"
	"slices"
)

// Registry holds the available operations, indexed by name.
type Registry struct {
	ops map[string]Operation
}

// NewRegistry builds a registry from the given operations.
// It returns an error if two operations share the same name.
func NewRegistry(ops ...Operation) (*Registry, error) {
	byName := make(map[string]Operation, len(ops))
	for _, op := range ops {
		if _, exists := byName[op.Name()]; exists {
			return nil, fmt.Errorf("duplicate operation %q", op.Name())
		}
		byName[op.Name()] = op
	}
	return &Registry{ops: byName}, nil
}

// Lookup returns the operation registered under name, or ErrUnknownOperation.
func (r *Registry) Lookup(name string) (Operation, error) {
	op, ok := r.ops[name]
	if !ok {
		return nil, fmt.Errorf("%w: %q", ErrUnknownOperation, name)
	}
	return op, nil
}

// Operations returns every registered operation, sorted by name so the output is stable.
func (r *Registry) Operations() []Operation {
	ops := make([]Operation, 0, len(r.ops))
	for _, name := range slices.Sorted(maps.Keys(r.ops)) {
		ops = append(ops, r.ops[name])
	}
	return ops
}
