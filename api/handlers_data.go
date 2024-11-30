package api

import (
	"encoding/json"
	"net/http"

	"github.com/g00dv1n/pgpanel/core"
)

func getRowsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")
		params := core.ParseGetRowsParamsFromQuery(r.URL.Query())

		rows, err := app.GetRows(tableName, &params)

		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		return WriteJson(w, rows)
	}
}
func insertRowHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")

		var row core.RawRow
		if err := json.NewDecoder(r.Body).Decode(&row); err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		rows, err := app.InsertRow(tableName, row)

		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		return WriteJson(w, rows)
	}
}

func updateRowsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")
		filters := core.ParseFiltersFromQuery(r.URL.Query())

		var row core.RawRow
		if err := json.NewDecoder(r.Body).Decode(&row); err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		rows, err := app.UpdateRows(tableName, filters, row)

		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		return WriteJson(w, rows)
	}
}

func deleteRowsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")
		filters := core.ParseFiltersFromQuery(r.URL.Query())

		rows, err := app.DeleteRows(tableName, filters)

		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		return WriteJson(w, rows)
	}
}
