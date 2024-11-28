package db

import (
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TablesMap map[string]*Table

type SchemaRepository struct {
	db         *pgxpool.Pool
	schemaExtr SchemaExtractor
	tablesMap  TablesMap
	logger     *slog.Logger
}

func NewSchemaRepository(db *pgxpool.Pool, schemaExtr SchemaExtractor, logger *slog.Logger) (*SchemaRepository, error) {
	tables, err := schemaExtr.GetTables()

	if err != nil {
		return nil, err
	}

	tablesMap := make(map[string]*Table, len(tables))

	for _, t := range tables {
		tablesMap[t.Name] = &t
	}

	return &SchemaRepository{db: db, tablesMap: tablesMap, logger: logger}, nil
}

func (r SchemaRepository) GetTablesMap() TablesMap {
	return r.tablesMap
}

func (r SchemaRepository) GetTable(name string) (*Table, error) {
	table := r.tablesMap[name]

	if table == nil {
		return nil, fmt.Errorf("can't lookup table: %s", name)
	}

	return table, nil
}
