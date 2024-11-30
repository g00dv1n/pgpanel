package core

import (
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TablesMap map[string]*Table

type SchemaRepository struct {
	db *pgxpool.Pool

	schemaExtr   SchemaExtractor
	tablesMap    TablesMap
	schemaLoaded bool

	logger *slog.Logger
}

func NewSchemaRepository(db *pgxpool.Pool, schemaExtr SchemaExtractor, logger *slog.Logger) (*SchemaRepository, error) {
	r := SchemaRepository{
		db: db,

		schemaExtr: schemaExtr,
		tablesMap:  make(TablesMap),

		logger: logger,
	}

	if err := r.loadTables(); err != nil {
		return nil, err
	}

	return &r, nil
}

func (r *SchemaRepository) GetTablesMap(reloadTables bool) TablesMap {
	if reloadTables {
		r.loadTables()
	}

	return r.tablesMap
}

func (r *SchemaRepository) GetTable(name string) (*Table, error) {
	table := r.tablesMap[name]

	if table == nil {
		return nil, fmt.Errorf("can't lookup table: %s", name)
	}

	return table, nil
}

func (r *SchemaRepository) loadTables() error {
	tables, err := r.schemaExtr.GetTables()

	if err != nil {
		return err
	}

	tablesMap := make(map[string]*Table, len(tables))

	for _, t := range tables {
		tablesMap[t.Name] = &t
	}

	r.tablesMap = tablesMap

	return nil
}
