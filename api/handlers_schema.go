package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/g00dv1n/pgpanel/core"
)

func getTablesHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		reload := r.URL.Query().Get("reload") == "true"

		return WriteJson(w, app.SchemaService.GetTablesMap(reload))
	}
}

func getTableHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")

		table, err := app.SchemaService.GetTable(tableName)

		if err != nil {
			return NewApiError(http.StatusNotFound, err)
		}

		return WriteJson(w, table)
	}
}

func getTableSettingsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")

		settings, err := app.SchemaService.GetTableSettings(tableName)

		if err != nil {
			if errors.Is(err, core.ErrUnknownTable) {
				return NewApiError(http.StatusNotFound, err)
			}

			return NewApiError(http.StatusInternalServerError, err)
		}

		return WriteJson(w, settings)
	}
}

func updateTableSettingsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")

		var updateSettings map[string]any
		if err := json.NewDecoder(r.Body).Decode(&updateSettings); err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		settings, err := app.SchemaService.UpdateTableSettings(tableName, updateSettings)

		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		return WriteJson(w, settings)
	}
}

func getStats(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		stats, err := app.SchemaService.GetStats()

		if err != nil {
			return NewApiError(http.StatusInternalServerError, err)
		}

		return WriteJson(w, stats)
	}
}
