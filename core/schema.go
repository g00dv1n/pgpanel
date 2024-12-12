package core

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Column struct {
	Name         string  `json:"name"`
	OID          int     `json:"OID"`
	RegType      string  `json:"regType"`
	UdtName      string  `json:"udtName"`
	IsNullable   bool    `json:"isNullable"`
	Default      *string `json:"default"`
	IsPrimaryKey bool    `json:"isPrimaryKey"`
}

// Safe name to use in SQL
func (c *Column) SafeName() string {
	return `"` + c.Name + `"`
}

type Table struct {
	Name    string   `json:"name"`
	Schema  string   `json:"schema"`
	Columns []Column `json:"columns"`
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

// Query tables from Postgres with enhanced schema information
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
					) AS is_primary_key
				FROM 
					information_schema.columns c
				WHERE 
					table_schema = $1 AND table_name = $2
				ORDER BY 
					ordinal_position ASC
		`, table.Schema, table.Name)

		if err != nil {
			return nil, err
		}
		defer rows.Close()

		for rows.Next() {
			var col Column

			if err := rows.Scan(
				&col.Name,
				&col.OID,
				&col.RegType,
				&col.UdtName,
				&col.IsNullable,
				&col.Default,
				&col.IsPrimaryKey,
			); err != nil {
				return nil, err
			}

			tables[i].Columns = append(tables[i].Columns, col)
		}
	}

	return tables, nil
}

// Table Settings related structs

type TableSettings struct {
	ViewLinkPattern  *string             `json:"viewLinkPattern"`
	OverriddenInputs OverriddenInputsMap `json:"overriddenInputs"`
}

type OverriddenInputsMap map[string]InputTypeLookup

type InputTypeLookup struct {
	Type    string `json:"type"`
	IsArray bool   `json:"isArray"`
	Payload any    `json:"payload"`
}

// Table Relations related structs

type RelationsConfig struct {
	MainTable         string `json:"mainTable"`         // The main table in the relationship
	RelationTable     string `json:"relationTable"`     // The related table in the relationship
	JoinTable         string `json:"joinTable"`         // The table used to join (for many-to-many relationships)
	MainJoinField     string `json:"mainJoinField"`     // The field in the main table used for the join
	RelationJoinField string `json:"relationJoinField"` // The field in the related table used for the join
	Bidirectional     bool   `json:"bidirectional"`     // Indicates if the relationship is bidirectional (optional)
}
