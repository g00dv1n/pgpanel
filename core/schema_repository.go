package core

import (
	"context"
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

var createAdminTablesSql = `
CREATE SCHEMA IF NOT EXISTS pgpanel;

CREATE TABLE IF NOT EXISTS pgpanel.metadata (
    id SERIAL PRIMARY KEY,
    config JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS pgpanel.admins (
    id SERIAL PRIMARY KEY,
    username TEXT,
    password_hash TEXT
);
`

func (r *SchemaRepository) CreateAdminTables() error {
	_, err := r.db.Exec(context.Background(), createAdminTablesSql)

	return err
}

var dropAdminTablesSql = `
DROP SCHEMA IF EXISTS pgpanel CASCADE
`

func (r *SchemaRepository) DropAdminTables() error {
	_, err := r.db.Exec(context.Background(), dropAdminTablesSql)

	return err
}

var getSchemaNamesSql = `
SELECT nspname 
FROM pg_catalog.pg_namespace 
WHERE nspname NOT IN (
  'pg_catalog', 
  'pg_toast', 
  'information_schema'
)
`

func (r *SchemaRepository) GetSchemaNames() ([]string, error) {
	rows, err := r.db.Query(context.Background(), getSchemaNamesSql)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schemas []string
	for rows.Next() {
		var schemaName string
		if err := rows.Scan(&schemaName); err != nil {
			return nil, err
		}
		schemas = append(schemas, schemaName)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return schemas, nil
}
