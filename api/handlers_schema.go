package api

import "net/http"

func (app *Handlers) getTablesHandler(w http.ResponseWriter, r *http.Request) error {
	reload := r.URL.Query().Get("reload") == "true"

	return WriteJson(w, app.Schema.GetTablesMap(reload))
}
