package api

import "net/http"

const UrlPrefix = "/api"

func (app *Handlers) MountRoutes(mux *http.ServeMux) {
	// -------Set Up API Roputer with Api prefix----
	api := http.NewServeMux()
	mux.Handle(UrlPrefix+"/", http.StripPrefix(UrlPrefix, api))

	// --------------SCHEMA API ENDPOINTS-------------------
	api.Handle("GET /schema/tables", CreateHandler(app.getTablesHandler, AuthMiddleware))
	// --------------DATA REST API ENDPOINTS-------------------
	api.Handle("GET /data/{table}", CreateHandler(app.getRowsHandler, AuthMiddleware))
	api.Handle("POST /data/{table}", CreateHandler(app.insertRowHandler, AuthMiddleware))
	api.Handle("PUT /data/{table}", CreateHandler(app.updateRowsHandler, AuthMiddleware))
	api.Handle("DELETE /data/{table}", CreateHandler(app.deleteRowsHandler, AuthMiddleware))
	// --------------SQL API ENDPOINTS-------------------
	api.Handle("POST /sql/execute", CreateHandler(app.executeSQLHandler, AuthMiddleware))
	// --------------ADMIN API ENDPOINTS-------------------
	api.Handle("POST /admin/login", CreateHandler(app.adminLoginHandler))
}
