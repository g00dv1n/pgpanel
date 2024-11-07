package core

import (
	"context"
	"database/sql"

	"github.com/jackc/pgx/v5/pgxpool"
)

type SchemaExtractor interface {
	GetTables() ([]Table, error)
}

type Column struct {
	Name       string         `json:"name"`
	DataType   string         `json:"dataType"`
	IsNullable string         `json:"isNullable"`
	Default    sql.NullString `json:"default"`
}

type Table struct {
	Name        string   `json:"name"`
	Columns     []Column `json:"columns"`
	PrimaryKeys []string `json:"primaryKeys"`
}

type DbSchemaExtractor struct {
	db         *pgxpool.Pool
	onlyTables []string
}

func NewDbSchemaExtractor(dbpool *pgxpool.Pool, onlyTables []string) DbSchemaExtractor {
	return DbSchemaExtractor{db: dbpool, onlyTables: onlyTables}
}

func (e DbSchemaExtractor) GetTables() ([]Table, error) {
	ctx := context.Background()

	var tables []Table

	if len(e.onlyTables) == 0 {
		// Get all tables
		rows, err := e.db.Query(ctx, `
			SELECT table_name 
			FROM information_schema.tables 
			WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
		`)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		for rows.Next() {
			var tableName string
			if err := rows.Scan(&tableName); err != nil {
				return nil, err
			}
			tables = append(tables, Table{Name: tableName})
		}
	} else {
		for _, tableName := range e.onlyTables {
			tables = append(tables, Table{Name: tableName})
		}
	}

	// Get columns for each table
	for i, table := range tables {
		rows, err := e.db.Query(ctx, `
			SELECT 
				column_name,
				data_type,
				is_nullable,
				column_default
			FROM 
				information_schema.columns
			WHERE 
				table_name = $1
			ORDER BY 
				ordinal_position ASC
		`, table.Name)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		for rows.Next() {
			var col Column
			if err := rows.Scan(&col.Name, &col.DataType, &col.IsNullable, &col.Default); err != nil {
				return nil, err
			}
			tables[i].Columns = append(tables[i].Columns, col)
		}
	}

	// Get primary keys for each table
	for i, table := range tables {
		rows, err := e.db.Query(ctx, `
			SELECT
				kc.column_name
			FROM 
				information_schema.table_constraints tc
				JOIN information_schema.key_column_usage kc 
				ON tc.constraint_name = kc.constraint_name
				AND tc.table_schema = kc.table_schema
			WHERE 
				tc.constraint_type = 'PRIMARY KEY' 
				AND tc.table_schema = 'public'
				AND tc.table_name = $1
			ORDER BY 
				kc.ordinal_position
		`, table.Name)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		for rows.Next() {
			var pkColumn string
			if err := rows.Scan(&pkColumn); err != nil {
				return nil, err
			}
			tables[i].PrimaryKeys = append(tables[i].PrimaryKeys, pkColumn)
		}
	}

	return tables, nil
}
