package core

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ---------------------- Column & Tables -------------------------------
type Column struct {
	Name       string  `json:"name"`
	OID        int     `json:"OID"`
	RegType    string  `json:"regType"`
	UdtName    string  `json:"udtName"`
	IsNullable bool    `json:"isNullable"`
	Default    *string `json:"default"`
}

// Safe name to use in SQL
func (c *Column) SafeName() string {
	return `"` + c.Name + `"`
}

type Table struct {
	Name        string   `json:"name"`
	Schema      string   `json:"schema"`
	Columns     []Column `json:"columns"`
	PrimaryKeys []string `json:"primaryKeys"`
}

// Safe name to use in SQL
func (t *Table) SafeName() string {
	return fmt.Sprintf(`"%s"."%s"`, t.Schema, t.Name)
}

func (t *Table) SafeColumnNames() []string {
	safeNames := make([]string, len(t.Columns))

	for i, c := range t.Columns {
		safeNames[i] = c.SafeName()
	}

	return safeNames
}

func (t *Table) GetColumn(name string) (*Column, bool) {
	for _, col := range t.Columns {
		if col.Name == name {
			return &col, true
		}
	}

	return nil, false
}

// ---------------------- GetTables -------------------------------

func GetTablesFromDB(db *pgxpool.Pool, schemaName string, includedTables []string) ([]Table, error) {
	ctx := context.Background()

	var tables []Table

	if len(includedTables) == 0 {
		// Get all tables
		rows, err := db.Query(ctx, `
			SELECT table_name 
			FROM information_schema.tables 
			WHERE table_schema = $1 AND table_type = 'BASE TABLE'
		`, schemaName)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		for rows.Next() {
			var tableName string
			if err := rows.Scan(&tableName); err != nil {
				return nil, err
			}
			tables = append(tables, Table{Name: tableName, Schema: schemaName})
		}
	} else {
		for _, tableName := range includedTables {
			tables = append(tables, Table{Name: tableName, Schema: schemaName})
		}
	}

	// Get columns for each table
	for i, table := range tables {
		rows, err := db.Query(ctx, `
			SELECT 
				column_name,
				udt_name::regtype::oid::int AS oid,
				udt_name::regtype AS regtype,
				udt_name,
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
			var IsNullableRaw string
			if err := rows.Scan(&col.Name, &col.OID, &col.RegType, &col.UdtName, &IsNullableRaw, &col.Default); err != nil {
				return nil, err
			}

			col.IsNullable = IsNullableRaw == "YES"

			tables[i].Columns = append(tables[i].Columns, col)
		}
	}

	// Get primary keys for each table
	for i, table := range tables {
		rows, err := db.Query(ctx, `
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
