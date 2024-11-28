package core

import (
	"encoding/json"
	"net/http"

	"github.com/g00dv1n/pgpanel/data"
)

func (app *App) getRowsHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")
	params := data.ParseGetRowsParamsFromQuery(r.URL.Query())

	rows, err := app.CRUD.GetRows(tableName, params)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	return sendJson(w, rows)
}

func (app *App) insertRowHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")

	var row data.RawRow
	if err := json.NewDecoder(r.Body).Decode(&row); err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	rows, err := app.CRUD.InsertRow(tableName, row)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	return sendJson(w, rows)
}

func (app *App) updateRowsHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")
	filters := data.ParseFiltersFromQuery(r.URL.Query())

	var row data.RawRow
	if err := json.NewDecoder(r.Body).Decode(&row); err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	rows, err := app.CRUD.UpdateRows(tableName, filters, row)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	return sendJson(w, rows)
}

func (app *App) deleteRowsHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")
	filters := data.ParseFiltersFromQuery(r.URL.Query())

	rows, err := app.CRUD.DeleteRows(tableName, filters)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	return sendJson(w, rows)
}
