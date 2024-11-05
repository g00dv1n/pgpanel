package core

import "net/http"

func (app *App) getRowsHandler(w http.ResponseWriter, r *http.Request) {
	tableName := r.PathValue("table")
	filters := ParseFiltersFromQuery(r.URL.Query())
	pagination := ParsePaginationFromQuery(r.URL.Query())

	data, err := app.Repo.GetRows(tableName, filters, pagination)

	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	w.Write(data)
}

func (app *App) Routes() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/data/{table}", app.getRowsHandler)

	return mux
}
