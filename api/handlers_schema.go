package api

import (
	"net/http"

	"github.com/g00dv1n/pgpanel/core"
)

func getTablesHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		reload := r.URL.Query().Get("reload") == "true"

		return WriteJson(w, app.SchemaRepository.GetTablesMap(reload))
	}
}

func getTableSettingsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")

		settings, err := app.SchemaRepository.GetTableSettings(tableName)

		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		return WriteJson(w, settings)
	}
}
