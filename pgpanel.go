package pgpanel

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"github.com/g00dv1n/pgpanel/api"
	"github.com/g00dv1n/pgpanel/core"
	"github.com/g00dv1n/pgpanel/ui"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PgPanel struct {
	*core.App

	mux *http.ServeMux
}

func New(pool *pgxpool.Pool, logger *slog.Logger) *PgPanel {
	app := core.NewApp(pool, logger)

	mux := http.NewServeMux()

	// Register embeded fronted serving
	mux.Handle("/", ui.Handler())

	api := api.NewHandlers(app)
	// Mount all api
	api.MountRoutes(mux)

	return &PgPanel{App: app, mux: mux}
}

// Add a custom router before run Serve
func (panel *PgPanel) AddRoute(pattern string, handler api.ApiHandler, middlewares ...api.ApiMiddleware) {
	panel.mux.Handle(pattern, api.CreateHandler(handler, middlewares...))
}

func (panel *PgPanel) Serve(port int) {
	addr := fmt.Sprintf(":%d", port)

	panel.Logger.Info("Running server on http://127.0.0.1" + addr)
	if err := http.ListenAndServe(addr, panel.mux); err != nil {
		fmt.Fprintf(os.Stderr, "Unable to ListenAndServe: %v\n", err)
		os.Exit(1)
	}
}
