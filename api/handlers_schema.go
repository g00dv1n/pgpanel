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
