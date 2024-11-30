package pgpanel

import (
	"context"
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

func New(connString string) *PgPanel {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	pool, err := pgxpool.New(context.Background(), connString)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}

	app := core.NewApp(pool, logger)

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
	defer panel.DB.Close()

	addr := fmt.Sprintf(":%d", port)

	panel.Logger.Info("Running server on http://127.0.0.1" + addr)
	if err := http.ListenAndServe(addr, panel.mux); err != nil {
		fmt.Fprintf(os.Stderr, "Unable to ListenAndServe: %v\n", err)
		os.Exit(1)
	}
}
