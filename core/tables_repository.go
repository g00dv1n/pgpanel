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

// ---------------------- Universal Get Rows -------------------------------
var GetRowsSQL = sqlTempl(`
	WITH q as (
		SELECT {{ .Select }}
		FROM "{{.From}}"
		{{.Where}}
		{{.OrderBy}}
		LIMIT {{.Limit}}
		OFFSET {{.Offset}}
	)
	SELECT 
		COALESCE(json_agg(row_to_json(q)), '[]'::json) as result
	FROM q
`)

func (r TablesRepository) GetRows(tableName string, params *GetRowsParams) (json.RawMessage, error) {
	table := r.tablesMap[tableName]

	if table == nil {
		return nil, fmt.Errorf("can't lookup table: %s", tableName)
	}

	if params == nil {
		params = DefaultGetRowsParams()
	}

	selectColumns := strings.Join(table.SafeColumnNames(), ",")
	where, args := params.Filters.ToSQL(table)
	orderBy := params.Sorting.ToSQL()

	var sql strings.Builder
	GetRowsSQL.Execute(&sql, map[string]any{
		"Select":  selectColumns,
		"From":    table.Name,
		"Where":   where,
		"OrderBy": orderBy,
		"Limit":   params.Pagination.Limit,
		"Offset":  params.Pagination.Offset,
	})

	row := r.db.QueryRow(context.TODO(), sql.String(), args...)

	var data json.RawMessage

	if err := row.Scan(&data); err != nil {
		return nil, fmt.Errorf("query for %s failed: %w", table.Name, err)
	}

	return data, nil
}
