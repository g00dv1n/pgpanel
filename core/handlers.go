package core

import (
	"encoding/json"
	"net/http"

	"github.com/g00dv1n/pgpanel/ui"
)

type ApiHandler func(w http.ResponseWriter, r *http.Request) error
type ApiErrorResponse struct {
	Message string `json:"message"`
}

func (app *App) getTablesHandler(w http.ResponseWriter, r *http.Request) error {
	return json.NewEncoder(w).Encode(app.Repo.tablesMap)
}

func (app *App) getRowsHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")
	filters := ParseFiltersFromQuery(r.URL.Query())
	pagination := ParsePaginationFromQuery(r.URL.Query())

	data, err := app.Repo.GetRows(tableName, filters, pagination)

	if err != nil {
		return err
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
		// TODO different codes
		for _, h := range handlers {
			if err := h(w, r); err != nil {

				res := ApiErrorResponse{
					Message: err.Error(),
				}

				w.WriteHeader(500)
				json.NewEncoder(w).Encode(&res)

				return
			}
		}
	}
}
