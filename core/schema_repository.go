package core

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TablesMap map[string]*Table

type SchemaRepository struct {
	SchemaName string

	db             *pgxpool.Pool
	includedTables []string
	tablesMap      TablesMap
	logger         *slog.Logger
}

func NewSchemaRepository(db *pgxpool.Pool, logger *slog.Logger, schemaName string, includedTables []string) (*SchemaRepository, error) {
	if schemaName == "" {
		schemaName = DefaultSchemaName
	}

	r := SchemaRepository{
		SchemaName: schemaName,

		db:             db,
		includedTables: includedTables,
		tablesMap:      make(TablesMap),
		logger:         logger,
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
	tables, err := GetTablesFromDB(r.db, r.SchemaName, r.includedTables)

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

CREATE TABLE IF NOT EXISTS pgpanel.settings (
    id SERIAL PRIMARY KEY,
		type TEXT NOT NULL,
		key TEXT NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pgpanel.admins (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
