package core

import "net/http"

func (app *App) getTablesHandler(w http.ResponseWriter, r *http.Request) error {
	return sendJson(w, app.TablesRepo.tablesMap)
}
