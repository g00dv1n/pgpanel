package app

import "net/http"

func (app *App) getTablesHandler(w http.ResponseWriter, r *http.Request) error {
	reload := r.URL.Query().Get("reload") == "true"

	return sendJson(w, app.Schema.GetTablesMap(reload))
}
