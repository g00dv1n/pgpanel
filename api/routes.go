package api

import (
	"net/http"

	"github.com/g00dv1n/pgpanel/core"
)

const UrlPrefix = "/api"

func MountRoutes(app *core.App, mux *http.ServeMux, ui http.Handler) {
	// Register embeded fronted serving (can skip ui serving if needed)
	if ui != nil {
		mux.Handle("/", ui)
	}

	// -------Set Up API Router with API prefix----
	api := http.NewServeMux()
	mux.Handle(UrlPrefix+"/", http.StripPrefix(UrlPrefix, api))

	// --------------SCHEMA API ENDPOINTS-------------------
	api.Handle("GET /schema/tables", CreateHandler(getTablesHandler(app), AuthMiddleware))

	// --------------DATA REST API ENDPOINTS-------------------
	api.Handle("GET /data/{table}", CreateHandler(getRowsHandler(app), AuthMiddleware))
	api.Handle("POST /data/{table}", CreateHandler(insertRowHandler(app), AuthMiddleware))
	api.Handle("PUT /data/{table}", CreateHandler(updateRowsHandler(app), AuthMiddleware))
	api.Handle("DELETE /data/{table}", CreateHandler(deleteRowsHandler(app), AuthMiddleware))

	// --------------SQL API ENDPOINTS-------------------
	api.Handle("POST /sql/execute", CreateHandler(executeSQLHandler(app), AuthMiddleware))

	// --------------ADMIN API ENDPOINTS-------------------
	api.Handle("POST /admin/login", CreateHandler(adminLoginHandler()))
}
