package pgpanel

import (
	"fmt"
	"net/http"
	"os"

	"github.com/g00dv1n/pgpanel/api"
	"github.com/g00dv1n/pgpanel/core"
	"github.com/g00dv1n/pgpanel/ui"
)

type PgPanel struct {
	*core.App

	mux *http.ServeMux
}

func NewWithConfig(config *core.Config) *PgPanel {
	app := core.NewAppWithConfig(config)
	return NewWithApp(app)
}

func NewWithApp(app *core.App) *PgPanel {
	mux := http.NewServeMux()

	// Mount all routes
	api.MountRoutes(app, mux, ui.Handler())

	return &PgPanel{App: app, mux: mux}
}

// Add a custom router before run Serve
func (panel *PgPanel) AddRoute(pattern string, handler api.ApiHandler, middlewares ...api.ApiMiddleware) {
	panel.mux.Handle(pattern, api.CreateHandler(handler, middlewares...))
}

func (panel *PgPanel) Serve(port int) {
	defer panel.Close()

	addr := fmt.Sprintf(":%d", port)

	panel.Logger.Info("Running server on http://127.0.0.1" + addr)
	if err := http.ListenAndServe(addr, panel.mux); err != nil {
		fmt.Fprintf(os.Stderr, "Unable to ListenAndServe: %v\n", err)
		os.Exit(1)
	}
}
