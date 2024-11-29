package core

import (
	"log/slog"
	"os"

	"github.com/g00dv1n/pgpanel/db"
	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	DB     *pgxpool.Pool
	Logger *slog.Logger
	Schema *db.SchemaRepository
	CRUD   *db.CrudService
}

func NewApp(pool *pgxpool.Pool, logger *slog.Logger) *App {
	if logger == nil {
		logger = slog.Default()
	}

	schema, err := db.NewSchemaRepository(pool, db.NewDbSchemaExtractor(pool, "public", nil), logger)
	if err != nil {
		logger.Error("can't extract tables", "error", err)
		os.Exit(1)
	}

	crud := db.NewCrudService(pool, schema, logger)

	return &App{
		DB:     pool,
		Logger: logger,
		Schema: schema,
		CRUD:   crud,
	}
}
