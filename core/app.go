package core

import (
	"log/slog"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Universal App struct to store important state and different helpers
type App struct {
	DB               *pgxpool.Pool
	Logger           *slog.Logger
	SchemaRepository *SchemaRepository
	CrudService      *CrudService
}

func NewApp(pool *pgxpool.Pool, logger *slog.Logger) *App {
	if logger == nil {
		logger = slog.Default()
	}

	schema, err := NewSchemaRepository(
		pool,
		NewDbSchemaExtractor(pool, "public", nil),
		logger,
	)

	if err != nil {
		logger.Error("can't extract tables", "error", err)
		os.Exit(1)
	}

	crud := NewCrudService(pool, schema, logger)

	return &App{
		DB:               pool,
		Logger:           logger,
		SchemaRepository: schema,
		CrudService:      crud,
	}
}

// close pool connections and potentially otrher stuff
func (app *App) Close() {
	app.DB.Close()
}

func (app *App) ExecuteSQL(req *SQLExecutionRequest) (*SQLExecutionResponse, error) {
	return req.Execute(app.DB)
}
