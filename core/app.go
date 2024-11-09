package core

import (
	"log/slog"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	DB     *pgxpool.Pool
	Logger *slog.Logger
	CRUD   *CrudRepository
}

func NewApp(db *pgxpool.Pool) App {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	se := NewDbSchemaExtractor(db, nil)
	tables, err := se.GetTables()

	if err != nil {
		logger.Error("can't extract tables", "error", err)
		os.Exit(1)
	}

	crud := NewCrudRepository(db, tables)

	return App{
		DB:     db,
		Logger: logger,
		CRUD:   &crud,
	}
}
