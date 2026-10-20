package httpapi

import (
	"encoding/json"
	"net/http"
)

// Request and response bodies. Struct tags set the JSON field names.

type calculateRequest struct {
	Operation string    `json:"operation"`
	Operands  []float64 `json:"operands"`
}

type calculateResponse struct {
	Operation string    `json:"operation"`
	Operands  []float64 `json:"operands"`
	Result    float64   `json:"result"`
}

type operationsResponse struct {
	Operations []operationDTO `json:"operations"`
}

type operationDTO struct {
	Name  string `json:"name"`
	Arity int    `json:"arity"`
}

type healthResponse struct {
	Status string `json:"status"`
}

type errorResponse struct {
	Error errorBody `json:"error"`
}

type errorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// writeJSON writes v as a JSON response with the given status code.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	// The status line is already sent, so an encoding error cannot change the response.
	_ = json.NewEncoder(w).Encode(v)
}

// writeError writes the API error shape: {"error":{"code":"...","message":"..."}}.
func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, errorResponse{Error: errorBody{Code: code, Message: message}})
}
