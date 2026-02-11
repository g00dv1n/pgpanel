package core

import (
	"fmt"
)

type Column struct {
	Name         string          `json:"name"`
	OID          int             `json:"OID"`
	RegType      string          `json:"regType"`
	UdtName      string          `json:"udtName"`
	IsText       bool            `json:"isText"`
	IsNullable   bool            `json:"isNullable"`
	Default      *string         `json:"default,omitempty"`
	IsPrimaryKey bool            `json:"isPrimaryKey"`
	ForeignKey   *ForeignKeyInfo `json:"foreignKey,omitempty"`
}

// Safe name to use in SQL
func (c *Column) SafeName() string {
	return `"` + c.Name + `"`
}

type ForeignKeyInfo struct {
	TableName      string `json:"tableName"`
	ColumnName     string `json:"columnName"`
	ConstraintName string `json:"constraintName"`
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

func (t *Table) ColumnsNames() []string {
	names := make([]string, len(t.Columns))

	for i, c := range t.Columns {
		names[i] = c.Name
	}

	return names
}

func (t *Table) GetColumn(name string) (*Column, bool) {
	for _, col := range t.Columns {
		if col.Name == name {
			return &col, true
		}
	}

	return nil, false
}

func (t *Table) GetColumns(names []string) []Column {
	var cols []Column

	for _, colName := range names {
		col, exists := t.GetColumn(colName)

		if exists {
			cols = append(cols, *col)
		}
	}

	return cols
}

func (t *Table) GetTextColumns() []Column {
	var cols []Column

	for _, col := range t.Columns {

		if col.IsText {
			cols = append(cols, col)
		}
	}

	return cols
}

func (t *Table) GetTextColumnsNames() []string {
	var cols []string

	for _, col := range t.Columns {

		if col.IsText {
			cols = append(cols, col.Name)
		}
	}

	return cols
}

func (t *Table) GetForeignKeyColumnByTable(foreignTableName string) (*Column, bool) {
	for _, col := range t.Columns {
		fk := col.ForeignKey

		if fk == nil {
			continue
		}

		if fk.TableName == foreignTableName {
			return &col, true
		}
	}

	return nil, false
}

func (t *Table) GetForeignKeyColumnsByTable(foreignTableName string) []Column {
	var fkCols []Column

	for _, col := range t.Columns {
		fk := col.ForeignKey

		if fk == nil {
			continue
		}

		if fk.TableName == foreignTableName {
			fkCols = append(fkCols, col)
		}
	}

	return fkCols
}

// Map to easily look up stored tables
type TablesMap map[string]*Table

func (m TablesMap) Names() []string {
	var names []string

	for n := range m {
		names = append(names, n)
	}

	return names
}

func (m TablesMap) Tables() []*Table {
	var tables []*Table

	for _, t := range m {
		tables = append(tables, t)
	}

	return tables
}

type TableSettingsMap map[string]*TableSettings

// Table Settings related structs
type TableSettings struct {
	ViewLinkPattern          string              `json:"viewLinkPattern,omitzero"`
	TableViewSelectColumns   []string            `json:"tableViewSelectColumns,omitempty"`
	TableViewTextFiltersCols []string            `json:"tableViewTextFiltersCols,omitempty"`
	OverriddenInputs         OverriddenInputsMap `json:"overriddenInputs,omitempty"`
	Relations                []RelationsConfig   `json:"relations,omitempty"`
}

type OverriddenInputsMap map[string]InputTypeLookup

type InputTypeLookup struct {
	Type    string `json:"type"`
	IsArray bool   `json:"isArray"`
	Payload any    `json:"payload"`
}

// Table Relations related structs

type RelationsConfig struct {
	MainTable     string `json:"mainTable"`     // The main table in the relationship
	RelationTable string `json:"relationTable"` // The related table in the relationship
	JoinTable     string `json:"joinTable"`     // The table used to join (for many-to-many relationships)
	Bidirectional bool   `json:"bidirectional"` // Indicates if the relationship is bidirectional (optional)
}

// DB stats related stuff

type DatabaseSchemaStats struct {
	DBName      string `json:"dbName"`
	SchemaName  string `json:"schemaName"`
	TablesCount int    `json:"tablesCount"`
	TotalRows   int64  `json:"totalRows"`
	Size        int64  `json:"size"`       // size in bytes
	SizePretty  string `json:"sizePretty"` // human-readable
}
