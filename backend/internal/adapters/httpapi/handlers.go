package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/gonzalolavin99/sezzle-fullstack-calculator/backend/internal/app"
)

type handlers struct {
	calc *app.Calculator
}

// calculate handles POST /api/v1/calculate.
func (h *handlers) calculate(w http.ResponseWriter, r *http.Request) {
	var req calculateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "request body must be valid JSON")
		return
	}

	result, err := h.calc.Calculate(req.Operation, req.Operands)
	if err != nil {
		// Provisional: task B9 maps each domain error to its own status and code.
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "unexpected error")
		return
	}

	writeJSON(w, http.StatusOK, calculateResponse{
		Operation: result.Operation,
		Operands:  result.Operands,
		Result:    result.Value,
	})
}

// operations handles GET /api/v1/operations.
func (h *handlers) operations(w http.ResponseWriter, _ *http.Request) {
	infos := h.calc.Operations()
	resp := operationsResponse{Operations: make([]operationDTO, 0, len(infos))}
	for _, info := range infos {
		resp.Operations = append(resp.Operations, operationDTO{Name: info.Name, Arity: info.Arity})
	}
	writeJSON(w, http.StatusOK, resp)
}

// health handles GET /healthz, used by Docker and CI to check the service is up.
func (h *handlers) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, healthResponse{Status: "ok"})
}
