package core

import (
	"log/slog"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	Logger *slog.Logger
	Repo   *CrudRepository
}

func NewApp(db *pgxpool.Pool) App {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	se := NewDbSchemaExtractor(db, nil)
	tables, err := se.GetTables()

	if err != nil {
		logger.Error("can't extract tables", "error", err)
		os.Exit(1)
	}

	repo := NewCrudRepository(db, tables)

	return App{
		Logger: logger,
		Repo:   &repo,
	}
}
