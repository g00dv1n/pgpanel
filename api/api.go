package api

import (
	"encoding/json"
	"net/http"

	"github.com/g00dv1n/pgpanel/core"
)

// Main Handlers Container with embedded App
type Handlers struct {
	*core.App
}

func NewHandlers(app *core.App) *Handlers {
	return &Handlers{app}
}

// ---------------------- API types -------------------------------

// The improved STD handler that can return error
type ApiHandler func(w http.ResponseWriter, r *http.Request) error

// The standard middleware type based on ApiHandler
type ApiMiddleware func(next ApiHandler) ApiHandler

// Helper to apply multiple middlewares to one handler
func ChainMiddlewares(handler ApiHandler, middlewares ...ApiMiddleware) ApiHandler {
	for i := len(middlewares) - 1; i >= 0; i-- {
		handler = middlewares[i](handler)
	}
	return handler
}

// Universal Api Error
type ApiError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func NewApiError(code int, err error) ApiError {
	return ApiError{
		Code:    code,
		Message: err.Error(),
	}
}

func (e ApiError) Error() string {
	return e.Message
}

// ------------------------- API helpers ---------------------------------

// helper to convert ApiHandler + Middlewares to STD http.HandlerFunc
func CreateHandler(handler ApiHandler, middlewares ...ApiMiddleware) http.HandlerFunc {
	h := ChainMiddlewares(handler, middlewares...)

	return func(w http.ResponseWriter, r *http.Request) {
		if err := h(w, r); err != nil {
			apiErr, ok := err.(ApiError)
			if !ok {
				apiErr = NewApiError(http.StatusInternalServerError, err)
			}

			w.WriteHeader(apiErr.Code)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(&apiErr)

			return
		}
	}
}

// simple helper that encode (when needed) JSON and write to http.ResponseWriter
func WriteJson(w http.ResponseWriter, data any) error {
	w.Header().Set("Content-Type", "application/json")
	// Handle different input types
	switch v := data.(type) {
	case []byte:
		// Direct write for byte slices
		_, err := w.Write(v)
		return err
	case json.RawMessage:
		// Direct write for JSON raw messages
		_, err := w.Write(v)
		return err
	case string:
		// Write string as bytes
		_, err := w.Write([]byte(v))
		return err
	default:
		// Fallback to JSON encoding for other types
		return json.NewEncoder(w).Encode(data)
	}
}
