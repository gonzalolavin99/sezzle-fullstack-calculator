package httpapi

import (
	"net/http"

	"github.com/gonzalolavin99/sezzle-fullstack-calculator/backend/internal/app"
)

type handlers struct {
	calc *app.Calculator
}

// calculate handles POST /api/v1/calculate.
func (h *handlers) calculate(w http.ResponseWriter, r *http.Request) {
	operation, operands, apiErr := decodeCalculateRequest(w, r)
	if apiErr != nil {
		writeError(w, apiErr.status, apiErr.code, apiErr.message)
		return
	}

	result, err := h.calc.Calculate(operation, operands)
	if err != nil {
		apiErr := fromDomainError(err)
		writeError(w, apiErr.status, apiErr.code, apiErr.message)
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
