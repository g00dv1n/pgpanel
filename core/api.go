package core

import (
	"encoding/json"
	"net/http"

	"github.com/g00dv1n/pgpanel/ui"
)

// ---------------------- API types -------------------------------
type ApiHandler func(w http.ResponseWriter, r *http.Request) error

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
func createApiHandler(handler ApiHandler, middlewares ...ApiMiddleware) http.HandlerFunc {
	h := Chain(handler, middlewares...)

	return func(w http.ResponseWriter, r *http.Request) {
		// In api we always return json (for error as well)
		w.Header().Add("Content-Type", "application/json")

		if err := h(w, r); err != nil {
			apiErr, ok := err.(ApiError)
			if !ok {
				apiErr = NewApiError(http.StatusInternalServerError, err)
			}

			w.WriteHeader(apiErr.Code)
			json.NewEncoder(w).Encode(&apiErr)

			return
		}
	}
}

func sendJson(w http.ResponseWriter, data any) error {
	// Check if the data is of type json.RawMessage
	if raw, ok := any(data).(json.RawMessage); ok {
		_, err := w.Write(raw)
		return err
	}

	// Fallback to using json.NewEncoder for other types
	return json.NewEncoder(w).Encode(data)
}

// ------------------------- ALL APP Routes ---------------------------------
func (app *App) Routes() *http.ServeMux {
	root := http.NewServeMux()

	//------- Register embeded fronted serving ------
	root.Handle("/", ui.Handler())
	//-----------------------------------------------

	// -------Set Up API Roputer with /api prefix----
	api := http.NewServeMux()
	root.Handle("/api/", http.StripPrefix("/api", api))

	// --------------DATA API ENDPOINTS-------------------
	api.Handle("GET /schema/tables", createApiHandler(app.getTablesHandler, AuthMiddleware))

	api.Handle("GET /data/{table}", createApiHandler(app.getRowsHandler, AuthMiddleware))
	api.Handle("POST /data/{table}", createApiHandler(app.insertRowHandler, AuthMiddleware))
	api.Handle("PUT /data/{table}", createApiHandler(app.updateRowsHandler, AuthMiddleware))
	api.Handle("DELETE /data/{table}", createApiHandler(app.deleteRowsHandler, AuthMiddleware))
	// --------------ADMIN API ENDPOINTS-------------------
	api.Handle("POST /admin/login", createApiHandler(app.adminLoginHandler))

	return root
}
