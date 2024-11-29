package core

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"github.com/g00dv1n/pgpanel/data"
	"github.com/g00dv1n/pgpanel/db"
	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	DB      *pgxpool.Pool
	Logger  *slog.Logger
	Schema  *db.SchemaRepository
	CRUD    *data.CrudService
	rootMux *http.ServeMux
}

func NewApp(pool *pgxpool.Pool, logger *slog.Logger) App {
	if logger == nil {
		logger = slog.Default()
	}

	schema, err := db.NewSchemaRepository(pool, db.NewDbSchemaExtractor(pool, "public", nil), logger)
	if err != nil {
		logger.Error("can't extract tables", "error", err)
		os.Exit(1)
	}

	crud := data.NewCrudService(pool, schema, logger)

	app := App{
		DB:     pool,
		Logger: logger,
		Schema: schema,
		CRUD:   crud,
	}

	app.initRoutes()

	return app
}

func (app *App) Serve(port int) {
	if app.rootMux == nil {
		fmt.Fprintf(os.Stderr, "APP routes are not inited")
		os.Exit(1)
	}

	addr := fmt.Sprintf(":%d", port)

	app.Logger.Info("Running server on http://" + addr)
	if err := http.ListenAndServe(addr, app.rootMux); err != nil {
		fmt.Fprintf(os.Stderr, "Unable to ListenAndServe: %v\n", err)
		os.Exit(1)
	}
}
