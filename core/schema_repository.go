package core

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrUnknownTable = errors.New("unknown table")
)

type SchemaRepository struct {
	SchemaName string

	db               *pgxpool.Pool
	includedTables   []string
	tablesMap        TablesMap
	tableSettingsMap TableSettingsMap
	logger           *slog.Logger
}

func NewSchemaRepository(db *pgxpool.Pool, logger *slog.Logger, schemaName string, includedTables []string) (*SchemaRepository, error) {
	if schemaName == "" {
		schemaName = DefaultSchemaName
	}

	r := SchemaRepository{
		SchemaName: schemaName,

		db:               db,
		includedTables:   includedTables,
		tablesMap:        make(TablesMap),
		tableSettingsMap: make(TableSettingsMap),
		logger:           logger,
	}

	if err := r.loadTablesFromDB(); err != nil {
		return nil, err
	}

	if err := r.loadTableSettingsFromDB(); err != nil {
		return nil, err
	}

	return &r, nil
}

func (r *SchemaRepository) loadTablesFromDB() error {
	ctx := context.Background()

	tablesMap := make(TablesMap)

	if len(r.includedTables) == 0 {
		// Get all tables
		rows, err := r.db.Query(ctx, `
			SELECT table_name 
			FROM information_schema.tables 
			WHERE table_schema = $1 AND table_type = 'BASE TABLE'
		`, r.SchemaName)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var tableName string
			if err := rows.Scan(&tableName); err != nil {
				return err
			}
			tablesMap[tableName] = &Table{Name: tableName, Schema: r.SchemaName}

		}
	} else {
		for _, tableName := range r.includedTables {
			tablesMap[tableName] = &Table{Name: tableName, Schema: r.SchemaName}
		}
	}

	// Get ALL columns for all tables
	rows, err := r.db.Query(ctx, `
			SELECT 
					table_name,
					column_name,
					udt_name::regtype::oid::int AS oid,
					udt_name::regtype AS regtype,
					udt_name,
					is_nullable = 'YES' AS is_nullable,
					column_default,
					(
						SELECT COUNT(*) > 0 
						FROM information_schema.key_column_usage kcu
						JOIN information_schema.table_constraints tc 
							ON tc.constraint_name = kcu.constraint_name
						WHERE 
							tc.table_schema = c.table_schema
							AND tc.table_name = c.table_name
							AND tc.constraint_type = 'PRIMARY KEY'
							AND kcu.column_name = c.column_name
					) AS is_primary_key,
					(
						SELECT json_build_object(
							'tableName', cl.table_name,
							'columnName', cl.column_name,
							'constraintName', fk.constraint_name
						)
						FROM information_schema.constraint_column_usage AS cl
						JOIN information_schema.referential_constraints fk 
								ON cl.constraint_name = fk.unique_constraint_name 
								AND cl.constraint_schema = fk.unique_constraint_schema
						JOIN information_schema.key_column_usage AS kcu
								ON kcu.constraint_name = fk.constraint_name
								AND kcu.constraint_schema = fk.constraint_schema
						WHERE 
								kcu.table_schema = c.table_schema
								AND kcu.table_name = c.table_name
								AND kcu.column_name = c.column_name
						
					) AS foreign_key_info
				FROM 
					information_schema.columns c
				WHERE 
					table_schema = $1 AND table_name = ANY($2)
				ORDER BY 
					ordinal_position ASC
		`, r.SchemaName, tablesMap.Names())

	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var tableName string
		var col Column

		if err := rows.Scan(
			&tableName,
			&col.Name,
			&col.OID,
			&col.RegType,
			&col.UdtName,
			&col.IsNullable,
			&col.Default,
			&col.IsPrimaryKey,
			&col.ForeignKey,
		); err != nil {
			return err
		}

		col.IsText = col.OID == pgtype.VarcharOID || col.OID == pgtype.TextOID

		tablesMap[tableName].Columns = append(tablesMap[tableName].Columns, col)
	}

	// set tableMap if there are no errors
	r.tablesMap = tablesMap
	return nil
}

func (r *SchemaRepository) getTableSettingsFromDB(tableName string) (*TableSettings, error) {
	table, err := r.GetTable(tableName)

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

	// Apply some defaults for the frontend

	// Add all cols if empty
	if len(result.TableViewSelectColumns) == 0 {
		result.TableViewSelectColumns = table.ColumnsNames()
	}

	// Add all text cols if empty
	if len(result.TableViewTextFiltersCols) == 0 {
		result.TableViewTextFiltersCols = table.GetTextColumnsNames()
	}

	return &result, nil
}

func (r *SchemaRepository) loadTableSettingsFromDB() error {
	for _, t := range r.tablesMap {
		settings, err := r.getTableSettingsFromDB(t.Name)

		if err != nil {
			return err
		}

		r.tableSettingsMap[t.Name] = settings
	}

	return nil
}

func (r *SchemaRepository) GetTablesMap(reloadTables bool) TablesMap {
	if reloadTables {
		r.loadTablesFromDB()
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
	settings := r.tableSettingsMap[tableName]

	if settings == nil {
		return nil, ErrUnknownTable
	}

	return settings, nil
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

	result := &TableSettings{}

	row := r.db.QueryRow(context.Background(), sql, tableName, updateSettings)
	err := row.Scan(&result)

	if err != nil {
		return nil, err
	}

	// update stored settings map
	r.tableSettingsMap[tableName] = result

	// and return it as well
	return result, nil
}

func (r *SchemaRepository) DBName() string {
	return r.db.Config().ConnConfig.Database
}

func (r *SchemaRepository) GetStats() (*DatabaseSchemaStats, error) {
	var stats DatabaseSchemaStats
	stats.DBName = r.DBName()
	stats.SchemaName = r.SchemaName

	querySQL := `
		WITH table_count AS (
		    SELECT COUNT(*) as cnt 
				FROM information_schema.tables 
		    WHERE table_schema = $1 AND table_type = 'BASE TABLE'
		),
		row_stats AS (
		    SELECT COALESCE(SUM(n_live_tup), 0) as rows 
				FROM pg_stat_user_tables 
		    WHERE schemaname = $1
		),
		size_stats AS (
		    SELECT 
		        COALESCE(SUM(pg_total_relation_size(c.oid)), 0) AS bytes
		    FROM pg_class c 
		    JOIN pg_namespace n ON n.oid = c.relnamespace
		    WHERE n.nspname = $1
		)
		SELECT tc.cnt, rs.rows, ss.bytes, pg_size_pretty(ss.bytes)
		FROM table_count tc, row_stats rs, size_stats ss;
  `

	// Single round-trip to the DB
	err := r.db.QueryRow(context.Background(), querySQL, r.SchemaName).Scan(
		&stats.TablesCount,
		&stats.TotalRows,
		&stats.Size,
		&stats.SizePretty,
	)

	if err != nil {
		return nil, fmt.Errorf("database stats query failed: %w", err)
	}

	return &stats, nil
}
