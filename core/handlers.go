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

// ---------------------- Data API Handleers -------------------------------
func (app *App) getTablesHandler(w http.ResponseWriter, r *http.Request) error {
	return json.NewEncoder(w).Encode(app.CRUD.tablesMap)
}

func (app *App) getRowsHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")
	params := ParseGetRowsParamsFromQuery(r.URL.Query())

	data, err := app.CRUD.GetRows(tableName, params)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	_, err = w.Write(data)
	return err
}

func (app *App) Routes() *http.ServeMux {
	root := http.NewServeMux()

	//------- Register embeded fronted serving ------
	root.Handle("/", ui.Handler())
	//-----------------------------------------------

	// -------Set Up API Roputer with /api prefix----
	api := http.NewServeMux()
	root.Handle("/api/", http.StripPrefix("/api", api))

	// --------------API ENDPOINTS-------------------
	api.Handle("GET /schema/tables", createApiHandler(app.getTablesHandler))
	api.Handle("GET /data/{table}", createApiHandler(app.getRowsHandler))

	return root
}

func createApiHandler(handlers ...ApiHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// In api we always return json (for error as well)
		w.Header().Add("Content-Type", "application/json")

		// execute all handlers one by one and return error early
		for _, h := range handlers {
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
}
