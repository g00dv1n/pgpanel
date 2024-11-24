package core

import (
	"log/slog"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	DB         *pgxpool.Pool
	Logger     *slog.Logger
	TablesRepo *TablesRepository
}

func NewApp(db *pgxpool.Pool, logger *slog.Logger) App {
	if logger == nil {
		logger = slog.Default()
	}

	se := NewDbSchemaExtractor(db, "public", nil)

	tr, err := NewTablesRepository(db, &se, logger)

	if err != nil {
		logger.Error("can't extract tables", "error", err)
		os.Exit(1)
	}

	return App{
		DB:         db,
		Logger:     logger,
		TablesRepo: tr,
	}
}
