package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/g00dv1n/pgpanel/core"
)

func getRowsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")
		params := core.ParseGetRowsParamsFromQuery(r.URL.Query())

		rows, err := app.CrudService.GetRows(tableName, &params)

		if err != nil {
			return mapDataError(err)
		}

		return WriteJson(w, rows)
	}
}
func insertRowHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")

		var row core.RawRow
		if err := json.NewDecoder(r.Body).Decode(&row); err != nil {
			return mapDataError(err)
		}

		rows, err := app.CrudService.InsertRow(tableName, row)

		if err != nil {
			return mapDataError(err)
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
			return mapDataError(err)
		}

		rows, err := app.CrudService.UpdateRows(tableName, filters, row)

		if err != nil {
			return mapDataError(err)
		}

		return WriteJson(w, rows)
	}
}

func deleteRowsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")
		filters := core.ParseFiltersFromQuery(r.URL.Query())

		rows, err := app.CrudService.DeleteRows(tableName, filters)

		if err != nil {
			return mapDataError(err)
		}

		return WriteJson(w, rows)
	}
}

// helper to proccess all CRUD related errors
func mapDataError(err error) ApiError {
	if errors.Is(err, core.ErrUnknownTable) {
		return NewApiError(http.StatusNotFound, err)
	}

	return NewApiError(http.StatusBadRequest, err)
}
