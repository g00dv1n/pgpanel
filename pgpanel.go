package pgpanel

import (
	"fmt"
	"net"
	"net/http"
	"os"

	"github.com/g00dv1n/pgpanel/api"
	"github.com/g00dv1n/pgpanel/core"
	"github.com/g00dv1n/pgpanel/ui"
)

const (
	DefaultHost = "127.0.0.1"
	DefaultPort = "3333"
)

type PgPanel struct {
	*core.App

	Port string
	Host string

	mux *http.ServeMux
}

func New(app *core.App) *PgPanel {
	mux := http.NewServeMux()

	// Mount all routes
	api.MountRoutes(app, mux, ui.Handler())

	return &PgPanel{
		App: app,

		Port: DefaultPort,
		Host: DefaultHost,

		mux: mux,
	}
}

// Add a custom router before run Serve
func (panel *PgPanel) AddRoute(pattern string, handler api.ApiHandler, middlewares ...api.ApiMiddleware) {
	panel.mux.Handle(pattern, api.CreateHandler(handler, middlewares...))
}

func (panel *PgPanel) Serve() {
	defer panel.Close()

	addr := net.JoinHostPort(panel.Host, panel.Port)

	panel.Logger.Info("Running server on http://" + addr)
	if err := http.ListenAndServe(addr, panel.mux); err != nil {
		fmt.Fprintf(os.Stderr, "Unable to ListenAndServe: %v\n", err)
		os.Exit(1)
	}
}
