package core

import (
	"context"
	"errors"
	"log/slog"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrUnknownTable = errors.New("unknown table")
)

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
		return nil, ErrUnknownTable
	}

	return table, nil
}

func (r *SchemaRepository) loadTables() error {
	tablesMap, err := GetTablesFromDB(r.db, r.SchemaName, r.includedTables)

	if err != nil {
		return err
	}

	r.tablesMap = tablesMap

	return nil
}

func (r *SchemaRepository) CreateAdminTables() error {
	sql := `
		CREATE SCHEMA IF NOT EXISTS pgpanel;

		CREATE TABLE IF NOT EXISTS pgpanel.settings (
				id SERIAL PRIMARY KEY,
				type TEXT NOT NULL,
				key TEXT NOT NULL,
				config JSONB DEFAULT '{}'::jsonb,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				CONSTRAINT unique_type_key UNIQUE (type, key)
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
	_, err := r.db.Exec(context.Background(), sql)

	return err
}

func (r *SchemaRepository) DropAdminTables() error {
	sql := "DROP SCHEMA IF EXISTS pgpanel CASCADE"

	_, err := r.db.Exec(context.Background(), sql)

	return err
}
func (r *SchemaRepository) GetSchemaNames() ([]string, error) {
	sql := `
		SELECT nspname 
		FROM pg_catalog.pg_namespace 
		WHERE nspname NOT IN (
			'pg_catalog', 
			'pg_toast', 
			'information_schema'
		)
	`

	rows, err := r.db.Query(context.Background(), sql)
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

func (r *SchemaRepository) GetTableSettings(tableName string) (*TableSettings, error) {
	_, err := r.GetTable(tableName)

	if err != nil {
		return nil, err
	}

	sql := `
		SELECT config FROM pgpanel.settings
		WHERE type = 'table_settings' AND key = $1
		LIMIT 1
	`

	var result TableSettings

	row := r.db.QueryRow(context.Background(), sql, tableName)
	err = row.Scan(&result)

	if errors.Is(err, pgx.ErrNoRows) {
		// skip
	} else if err != nil {
		return nil, err
	}

	return &result, nil
}

func (r *SchemaRepository) UpdateTableSettings(tableName string, updateSettings map[string]any) (*TableSettings, error) {
	sql := `
		INSERT INTO pgpanel.settings (type, key, config)
		VALUES ('table_settings', $1, $2)
		ON CONFLICT (type, key) 
		DO UPDATE SET 
    config = pgpanel.settings.config || EXCLUDED.config,
    updated_at = CURRENT_TIMESTAMP
		RETURNING config
	`

	var result TableSettings

	row := r.db.QueryRow(context.Background(), sql, tableName, updateSettings)
	err := row.Scan(&result)

	if err != nil {
		return nil, err
	}

	return &result, nil
}
