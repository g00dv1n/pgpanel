package core

import (
	"encoding/json"
	"net/http"
)

// ---------------------- Data API Handleers -------------------------------
func (app *App) getTablesHandler(w http.ResponseWriter, r *http.Request) error {
	return sendJson(w, app.TablesRepo.tablesMap)
}

func (app *App) getRowsHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")
	params := ParseGetRowsParamsFromQuery(r.URL.Query())

	data, err := app.TablesRepo.GetRows(tableName, params)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	return sendJson(w, data)
}

func (app *App) insertRowHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")

	var row RawRow
	if err := json.NewDecoder(r.Body).Decode(&row); err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	data, err := app.TablesRepo.InsertRow(tableName, row)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	return sendJson(w, data)
}

func (app *App) updateRowsHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")
	filters := ParseFiltersFromQuery(r.URL.Query())

	var row RawRow
	if err := json.NewDecoder(r.Body).Decode(&row); err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	data, err := app.TablesRepo.UpdateRows(tableName, filters, row)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	return sendJson(w, data)
}

func (app *App) deleteRowsHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")
	filters := ParseFiltersFromQuery(r.URL.Query())

	data, err := app.TablesRepo.DeleteRows(tableName, filters)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	return sendJson(w, data)
}
