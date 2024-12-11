package core

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"text/template"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CrudService struct {
	db     *pgxpool.Pool
	schema *SchemaRepository
	logger *slog.Logger
}

func NewCrudService(db *pgxpool.Pool, schema *SchemaRepository, logger *slog.Logger) *CrudService {
	return &CrudService{db: db, schema: schema, logger: logger}
}

func (s CrudService) queryAsJson(sql string, args []any) (json.RawMessage, error) {
	jsonSqlWrapper := fmt.Sprintf(`
		WITH q as (%s)
		SELECT 
			COALESCE(json_agg(row_to_json(q)), '[]'::json) as result
		FROM q
	`, sql)

	row := s.db.QueryRow(context.TODO(), jsonSqlWrapper, args...)

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

func (s CrudService) GetRows(tableName string, params *GetRowsParams) (json.RawMessage, error) {
	table, err := s.schema.GetTable(tableName)

	if err != nil {
		return nil, err
	}

	if params == nil {
		params = DefaultGetRowsParams()
	}

	// filters can be nil because it is an interface
	if params.Filters == nil {
		params.Filters = SQLFilters{}
	}

	// apply default sorting for consistency
	if params.Sorting.IsEmpty() {
		params.Sorting = DefaultTableSorting(table)
	}

	selectColumns := strings.Join(table.SafeColumnNames(), ",")
	where, args := params.Filters.ToSQL(table)
	orderBy := params.Sorting.ToSQL()

	sql := getRowsSQL.run(map[string]any{
		"Select":  selectColumns,
		"From":    table.SafeName(),
		"Where":   where,
		"OrderBy": orderBy,
		"Limit":   params.Pagination.Limit,
		"Offset":  params.Pagination.Offset,
	})

	return s.queryAsJson(sql, args)
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

func (s CrudService) UpdateRows(tableName string, filters Filters, row RawRow) (json.RawMessage, error) {
	table, err := s.schema.GetTable(tableName)

	if err != nil {
		return nil, err
	}

	where, whereArgs := filters.ToSQL(table)
	updates, updatesArgs := row.ToUpdateSQL(table, len(whereArgs))

	if len(updates) == 0 {
		return nil, errors.New("can't update rows with zero valid columns.")
	}

	args := append(whereArgs, updatesArgs...)

	sql := updateRowsSQL.run(map[string]any{
		"TableName": table.SafeName(),
		"Updates":   updates,
		"Where":     where,
	})

	return s.queryAsJson(sql, args)
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

func (s CrudService) InsertRow(tableName string, row RawRow) (json.RawMessage, error) {
	table, err := s.schema.GetTable(tableName)

	if err != nil {
		return nil, err
	}

	insertColumns, insertValues, args := row.ToInsertSQL(table, 0)

	if len(insertColumns) == 0 {
		return nil, errors.New("can't insert row with zero valid columns.")
	}

	sql := insertRowSQL.run(map[string]any{
		"TableName": table.SafeName(),
		"Columns":   insertColumns,
		"Values":    insertValues,
	})

	return s.queryAsJson(sql, args)
}

// ---------------------- Universal Delete Rows -------------------------------
var deleteRowsSQL = sqlTempl(`
	DELETE FROM {{.TableName}} 
	{{.Where}}
	RETURNING *
`)

func (s CrudService) DeleteRows(tableName string, filters Filters) (json.RawMessage, error) {
	table, err := s.schema.GetTable(tableName)

	if err != nil {
		return nil, err
	}

	where, args := filters.ToSQL(table)

	if len(where) == 0 {
		return nil, errors.New("can't delete rows with empty filters.")
	}

	sql := deleteRowsSQL.run(map[string]any{
		"TableName": table.SafeName(),
		"Where":     where,
	})

	return s.queryAsJson(sql, args)
}

// small utiliy to work with SQL temlates as STD Text Template
type sqlTemplate struct {
	t *template.Template
}

func sqlTempl(sql string) sqlTemplate {
	return sqlTemplate{template.Must(template.New("sql").Parse(sql))}
}

func (st *sqlTemplate) run(data any) string {
	var sql strings.Builder
	st.t.Execute(&sql, data)

	return sql.String()
}
