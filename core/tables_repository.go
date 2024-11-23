package core

import (
	"context"
	"encoding/json"
	"errors"
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

	return &TablesRepository{db: db, tablesMap: tablesMap, logger: logger}, nil
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
type RawRow map[string]any

func (rr RawRow) ToUpdateSQL(table *Table, paramsOffset int) (string, []any) {
	i := 1

	args := make([]any, 0, len(rr))
	updates := make([]string, 0, len(rr))

	for columnName, value := range rr {
		// Check if this column exists in table and skip if not exists
		if _, validColumn := table.GetColumn(columnName); !validColumn {
			continue
		}

		updates = append(updates, fmt.Sprintf(`"%s" = $%d`, columnName, i+paramsOffset))
		args = append(args, value)
		i += 1
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

func (r TablesRepository) UpdateRows(tableName string, filters Filters, row RawRow) (json.RawMessage, error) {
	table, err := r.GetTable(tableName)

	if err != nil {
		return nil, err
	}

	where, whereArgs := filters.ToSQL(table)
	updates, updatesArgs := row.ToUpdateSQL(table, len(whereArgs))

	if len(updates) == 0 {
		return nil, errors.New("can't update rows with zero valid columns.")
	}

	args := append(whereArgs, updatesArgs...)

	var sql strings.Builder
	updateRowsSQL.Execute(&sql, map[string]any{
		"TableName": table.SafeName(),
		"Updates":   updates,
		"Where":     where,
	})

	return r.QueryAsJson(sql.String(), args)
}

// ---------------------- Universal Insert Row -------------------------------
func (rr RawRow) ToInsertSQL(table *Table, paramsOffset int) (string, string, []any) {
	i := 1

	insertColumns := make([]string, 0, len(rr))
	insertValues := make([]string, 0, len(rr))
	args := make([]any, 0, len(rr))

	for columnName, value := range rr {
		// Check if this column exists in table and skip if not exists
		col, validColumn := table.GetColumn(columnName)
		if !validColumn {
			continue
		}

		insertColumns = append(insertColumns, col.SafeName())
		insertValues = append(insertValues, fmt.Sprintf("$%d", i+paramsOffset))
		args = append(args, value)
		i += 1
	}

	if len(insertColumns) == 0 {
		return "", "", nil
	}

	return fmt.Sprintf("(%s)", strings.Join(insertColumns, ",")), fmt.Sprintf("(%s)", strings.Join(insertValues, ",")), args
}

var insertRowSQL = sqlTempl(`
	INSERT INTO {{.TableName}} {{.Columns}}
	VALUES {{.Values}}
	RETURNING *
`)

func (r TablesRepository) InsertRow(tableName string, row RawRow) (json.RawMessage, error) {
	table, err := r.GetTable(tableName)

	if err != nil {
		return nil, err
	}

	insertColumns, insertValues, args := row.ToInsertSQL(table, 0)

	if len(insertColumns) == 0 {
		return nil, errors.New("can't insert row with zero valid columns.")
	}

	var sql strings.Builder
	insertRowSQL.Execute(&sql, map[string]any{
		"TableName": table.SafeName(),
		"Columns":   insertColumns,
		"Values":    insertValues,
	})

	return r.QueryAsJson(sql.String(), args)
}

// ---------------------- Universal Delete Rows -------------------------------
var deleteRowsSQL = sqlTempl(`
	DELETE FROM {{.TableName}} 
	{{.Where}}
	RETURNING *
`)

func (r TablesRepository) DeleteRows(tableName string, filters Filters) (json.RawMessage, error) {
	table, err := r.GetTable(tableName)

	if err != nil {
		return nil, err
	}

	where, args := filters.ToSQL(table)

	if len(where) == 0 {
		return nil, errors.New("can't delete rows with empty filters.")
	}

	var sql strings.Builder
	deleteRowsSQL.Execute(&sql, map[string]any{
		"TableName": table.SafeName(),
		"Where":     where,
	})

	return r.QueryAsJson(sql.String(), args)
}
