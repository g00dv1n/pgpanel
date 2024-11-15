package core

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"text/template"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TablesRepository struct {
	db        *pgxpool.Pool
	tablesMap map[string]*Table
}

func NewTablesRepository(db *pgxpool.Pool, tables []Table) TablesRepository {
	tablesMap := make(map[string]*Table, len(tables))

	for _, t := range tables {
		tablesMap[t.Name] = &t
	}

	return TablesRepository{
		db:        db,
		tablesMap: tablesMap,
	}
}

var GetRowsSQL *template.Template = sqlTempl(`
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

func (r TablesRepository) GetRows(tableName string, f Filters, p Pagination, s Sorting) (json.RawMessage, error) {
	table := r.tablesMap[tableName]

	if table == nil {
		return nil, fmt.Errorf("can't lookup table: %s", tableName)
	}

	where, args := f.ToSQL(table)
	orderBy := s.ToSQL()

	var sql strings.Builder
	GetRowsSQL.Execute(&sql, map[string]any{
		"Select":  ToSqlColumns(table),
		"From":    table.Name,
		"Where":   where,
		"OrderBy": orderBy,
		"Limit":   p.Limit,
		"Offset":  p.Offset,
	})

	row := r.db.QueryRow(context.TODO(), sql.String(), args...)

	var data json.RawMessage

	if err := row.Scan(&data); err != nil {
		return nil, fmt.Errorf("query for %s failed: %w", table.Name, err)
	}

	return data, nil
}

type Pagination struct {
	Limit  int
	Offset int
}

func ParsePaginationFromQuery(q url.Values) Pagination {
	offsetStr := q.Get("offset")
	limitStr := q.Get("limit")

	offset, offsetErr := strconv.Atoi(offsetStr)
	if offsetErr != nil || offset < 0 {
		offset = 0
	}

	limit, limitErr := strconv.Atoi(limitStr)
	if limitErr != nil || limit < 1 {
		limit = 50
	}

	return Pagination{Offset: offset, Limit: limit}
}

type SortingField struct {
	Name  string
	Order string
}
type Sorting []SortingField

func ParseSortingFromQuery(q url.Values) Sorting {
	sort := q.Get("sort")

	if len(sort) == 0 {
		return nil
	}

	fieldsRaw := strings.Split(sort, fieldsDelimiter)
	fields := make([]SortingField, 0, len(fieldsRaw))

	for _, fr := range fieldsRaw {
		if len(fr) == 0 {
			continue
		}

		if strings.HasPrefix(fr, "-") {
			fields = append(fields, SortingField{Name: strings.TrimPrefix(fr, "-"), Order: "DESC"})
		} else {
			fields = append(fields, SortingField{Name: fr, Order: "ASC"})
		}
	}

	return fields
}

func (s Sorting) ToSQL() string {
	if len(s) == 0 {
		return ""
	}

	sql := "ORDER BY "

	for i, sf := range s {
		sql += fmt.Sprintf(`"%s" %s`, sf.Name, sf.Order)

		if i+1 != len(s) {
			sql += ","
		}
	}

	return sql
}

func ToSqlColumns(t *Table) string {
	sql := ""

	for i, c := range t.Columns {
		sql += fmt.Sprintf(`"%s"`, c.Name)

		if i+1 != len(t.Columns) {
			sql += ","
		}
	}

	return sql
}
