package core

import (
	"context"
	"fmt"
	"log/slog"
	"slices"

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
		// don't expose admin tables
		if slices.Contains(adminTables, t.Name) {
			continue
		}

		tablesMap[t.Name] = &t
	}

	r.tablesMap = tablesMap

	return nil
}

var createAdminTablesSql = `
	CREATE TABLE IF NOT EXISTS pgpanel_metadata (
    id SERIAL PRIMARY KEY,
		config JSONB
	);


	CREATE TABLE IF NOT EXISTS pgpanel_admins (
		id SERIAL PRIMARY KEY,
		username TEXT,
		password_hash TEXT
	);
`

var adminTables = []string{"pgpanel_metadata", "pgpanel_admins"}

func (r *SchemaRepository) CreateAdminTables() error {
	_, err := r.db.Exec(context.Background(), createAdminTablesSql)

	return err
}

var dropAdminTablesSql = `
	DROP TABLE IF EXISTS pgpanel_metadata, pgpanel_admins;
`

func (r *SchemaRepository) DropAdminTables() error {
	_, err := r.db.Exec(context.Background(), dropAdminTablesSql)

	return err
}
