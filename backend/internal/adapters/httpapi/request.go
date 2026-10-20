package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// maxBodyBytes caps the request body; a calculate request is a few dozen bytes.
const maxBodyBytes = 64 << 10 // 64 KiB

// apiError is an error ready to be written as a JSON response.
type apiError struct {
	status  int
	code    string
	message string
}

func invalidRequest(message string) *apiError {
	return &apiError{status: http.StatusBadRequest, code: "INVALID_REQUEST", message: message}
}

func invalidOperand(message string) *apiError {
	return &apiError{status: http.StatusBadRequest, code: "INVALID_OPERAND", message: message}
}

// calculateRequest uses pointers to tell a missing or null value apart from a zero value:
// without them, encoding/json would silently turn [1, null] into [1, 0].
type calculateRequest struct {
	Operation *string    `json:"operation"`
	Operands  []*float64 `json:"operands"`
}

// decodeCalculateRequest reads and validates the body of POST /api/v1/calculate.
// It accepts exactly one JSON object with known fields only, and checks required fields.
// Rules about the operation itself (name, arity, math) belong to the domain.
func decodeCalculateRequest(w http.ResponseWriter, r *http.Request) (string, []float64, *apiError) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	var req calculateRequest
	if err := dec.Decode(&req); err != nil {
		return "", nil, decodeError(err)
	}
	if err := dec.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return "", nil, invalidRequest("request body must contain a single JSON object")
	}

	if req.Operation == nil {
		return "", nil, invalidRequest(`field "operation" is required`)
	}
	if req.Operands == nil {
		return "", nil, invalidRequest(`field "operands" is required`)
	}

	operands := make([]float64, len(req.Operands))
	for i, x := range req.Operands {
		if x == nil {
			return "", nil, invalidOperand(fmt.Sprintf("operand %d is null", i))
		}
		operands[i] = *x
	}
	return *req.Operation, operands, nil
}

// decodeError turns a JSON decoding error into a client-facing error without leaking internals.
func decodeError(err error) *apiError {
	var tooLarge *http.MaxBytesError
	var wrongType *json.UnmarshalTypeError

	switch {
	case errors.As(err, &tooLarge):
		return invalidRequest(fmt.Sprintf("request body must be at most %d bytes", maxBodyBytes))
	case errors.Is(err, io.EOF):
		return invalidRequest("request body is empty")
	case errors.As(err, &wrongType):
		switch {
		case wrongType.Field == "":
			return invalidRequest("request body must be a JSON object")
		case wrongType.Field == "operands":
			// The whole field has the wrong type, for example "operands": "1,2".
			return invalidRequest(`field "operands" must be an array of numbers`)
		case strings.HasPrefix(wrongType.Field, "operands."):
			// One element (reported as "operands.0") has the wrong type ("1") or does not
			// fit in a float64 (1e999).
			return invalidOperand(fmt.Sprintf("operand %s must be a finite number",
				strings.TrimPrefix(wrongType.Field, "operands.")))
		default:
			return invalidRequest(fmt.Sprintf("field %q has the wrong type", wrongType.Field))
		}
	case strings.HasPrefix(err.Error(), "json: unknown field "):
		// encoding/json has no typed error for unknown fields, so the message is matched.
		return invalidRequest(strings.TrimPrefix(err.Error(), "json: "))
	default:
		return invalidRequest("request body must be valid JSON")
	}
}
