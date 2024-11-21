package core

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TablesRepository struct {
	db         *pgxpool.Pool
	schemaExtr SchemaExtractor
	tablesMap  map[string]*Table
	logger     *slog.Logger
}

func NewTablesRepository(db *pgxpool.Pool, schemaExtr SchemaExtractor, logger *slog.Logger) (*TablesRepository, error) {
	tables, err := schemaExtr.GetTables()

	if err != nil {
		return nil, err
	}

	tablesMap := make(map[string]*Table, len(tables))

	for _, t := range tables {
		tablesMap[t.Name] = &t
	}

	return &TablesRepository{db: db, tablesMap: tablesMap}, nil
}

func (r TablesRepository) GetTable(name string) (*Table, error) {
	table := r.tablesMap[name]

	if table == nil {
		return nil, fmt.Errorf("can't lookup table: %s", name)
	}

	return table, nil
}

func (r TablesRepository) QueryAsJson(sql string, args []any) (json.RawMessage, error) {
	jsonSqlWrapper := fmt.Sprintf(`
		WITH q as (%s)
		SELECT 
			COALESCE(json_agg(row_to_json(q)), '[]'::json) as result
		FROM q
	`, sql)

	row := r.db.QueryRow(context.TODO(), jsonSqlWrapper, args...)

	var result json.RawMessage
	err := row.Scan(&result)

	return result, err
}

// ---------------------- Universal Get Rows -------------------------------
var getRowsSQL = sqlTempl(`
	SELECT {{ .Select }}
	FROM {{.From}}
	{{.Where}}
	{{.OrderBy}}
	LIMIT {{.Limit}}
	OFFSET {{.Offset}}
`)

func (r TablesRepository) GetRows(tableName string, params *GetRowsParams) (json.RawMessage, error) {
	table, err := r.GetTable(tableName)

	if err != nil {
		return nil, err
	}

	if params == nil {
		params = DefaultGetRowsParams()
	}

	selectColumns := strings.Join(table.SafeColumnNames(), ",")
	where, args := params.Filters.ToSQL(table)
	orderBy := params.Sorting.ToSQL()

	var sql strings.Builder
	getRowsSQL.Execute(&sql, map[string]any{
		"Select":  selectColumns,
		"From":    table.SafeName(),
		"Where":   where,
		"OrderBy": orderBy,
		"Limit":   params.Pagination.Limit,
		"Offset":  params.Pagination.Offset,
	})

	return r.QueryAsJson(sql.String(), args)
}

// ---------------------- Universal Update Rows -------------------------------
type UpdateFields map[string]any

func (f UpdateFields) ToSQL(paramsIndex int) (string, []any) {
	i := 0
	size := len(f)

	args := make([]any, 0, size)
	updates := make([]string, 0, size)

	for columnName, value := range f {
		i += 1
		updates = append(updates, fmt.Sprintf(`"%s" = $%d`, columnName, i+paramsIndex))
		args = append(args, value)
	}

	sql := strings.Join(updates, ", ")

	return sql, args
}

var updateRowsSQL = sqlTempl(`
	UPDATE {{.TableName}}
	SET {{.Updates}}
	{{.Where}}
	RETURNING *
`)

func (r TablesRepository) UpdateRows(tableName string, filters Filters, updateFields UpdateFields) (json.RawMessage, error) {
	table, err := r.GetTable(tableName)

	if err != nil {
		return nil, err
	}

	where, whereArgs := filters.ToSQL(table)
	updates, updatesArgs := updateFields.ToSQL(len(whereArgs))

	args := append(whereArgs, updatesArgs...)

	var sql strings.Builder
	updateRowsSQL.Execute(&sql, map[string]any{
		"TableName": table.SafeName(),
		"Updates":   updates,
		"Where":     where,
	})

	return r.QueryAsJson(sql.String(), args)
}
