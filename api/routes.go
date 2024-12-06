package api

import (
	"net/http"

	"github.com/g00dv1n/pgpanel/core"
)

const UrlPrefix = "/api"

type routeConfig struct {
	pattern string
	hw      func(app *core.App) ApiHandler
	auth    bool
}

const (
	authEnabled  = true
	authDisabled = false
)

// ALL API routes
var routes = []routeConfig{
	// Schema API endpoints
	{"GET /schema/tables", getTablesHandler, authEnabled},
	{"GET /schema/{table}/settings", getTableSettingsHandler, authEnabled},

	// Data REST API endpoints
	{"GET /data/{table}", getRowsHandler, authEnabled},
	{"POST /data/{table}", insertRowHandler, authEnabled},
	{"PUT /data/{table}", updateRowsHandler, authEnabled},
	{"DELETE /data/{table}", deleteRowsHandler, authEnabled},

	// SQL API endpoints
	{"POST /sql/execute", executeSQLHandler, authEnabled},

	// Admin API endpoints
	{"POST /admin/login", adminLoginHandler, authDisabled},
}

func MountRoutes(app *core.App, mux *http.ServeMux, ui http.Handler) {
	// Register embeded fronted serving (can skip ui serving if needed)
	if ui != nil {
		mux.Handle("/", ui)
	}
	// -------Set Up API Router with API prefix----
	api := http.NewServeMux()
	mux.Handle(UrlPrefix+"/", http.StripPrefix(UrlPrefix, api))

	// Mount all routes
	for _, route := range routes {
		var middlewares []ApiMiddleware

		if route.auth == authEnabled {
			middlewares = append(middlewares, AuthMiddleware)
		}

		api.Handle(route.pattern, CreateHandler(route.hw(app), middlewares...))
	}
}
