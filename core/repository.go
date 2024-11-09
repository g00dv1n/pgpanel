package core

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"
	"strings"

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

func (r TablesRepository) GetRowsWithPageInfo(tableName string, f Filters, p Pagination) (json.RawMessage, error) {
	table := r.tablesMap[tableName]

	if table == nil {
		return nil, fmt.Errorf("can't lookup table: %s", tableName)
	}

	fullSqlTemplate := `
			WITH q as (%s),
			paginated_q as (%s),
			total_count as (%s)
			SELECT 
				json_build_object(
					'rows', ,
					'total', total_count.value,
					'page', %d,
					'limit', %d
				) as result
			FROM paginated_q
			CROSS JOIN total_count
			GROUP BY  total_count.value
	`

	/// MAIN QUERY
	q := fmt.Sprintf(
		`SELECT %s FROM "%s" %s`,
		ToSqlColumns(table), table.Name, f.ToSQL(),
	)

	paginated := fmt.Sprintf(
		"SELECT * FROM q LIMIT %d OFFSET %d",
		p.Limit, p.Offset,
	)
	/// COUNT of rows from main query
	totalCount := "SELECT COUNT(*) AS value FROM q"

	/// FULL SQL with all params applied
	fullSql := fmt.Sprintf(fullSqlTemplate, q, paginated, totalCount, p.Page, p.Limit)

	row := r.db.QueryRow(context.TODO(), fullSql, f.Args...)

	var data json.RawMessage

	if err := row.Scan(&data); err != nil {
		return nil, fmt.Errorf("query for %s failed: %w", table.Name, err)
	}

	return data, nil
}

func (r TablesRepository) GetRows(tableName string, f Filters, p Pagination, s Sorting) (json.RawMessage, error) {
	table := r.tablesMap[tableName]

	if table == nil {
		return nil, fmt.Errorf("can't lookup table: %s", tableName)
	}

	fullSqlTemplate := `
			WITH q as (%s)
			SELECT 
				COALESCE(json_agg(row_to_json(q)), '[]'::json) as result
			FROM q
	`

	/// MAIN QUERY
	q := fmt.Sprintf(
		`SELECT %s FROM "%s" %s %s LIMIT %d OFFSET %d`,
		ToSqlColumns(table), table.Name, f.ToSQL(), s.ToSQL(), p.Limit, p.Offset,
	)

	/// FULL SQL with all params applied
	fullSql := fmt.Sprintf(fullSqlTemplate, q)

	row := r.db.QueryRow(context.TODO(), fullSql, f.Args...)

	var data json.RawMessage

	if err := row.Scan(&data); err != nil {
		return nil, fmt.Errorf("query for %s failed: %w", table.Name, err)
	}

	return data, nil
}

type Pagination struct {
	Page   int
	Limit  int
	Offset int
}

func ParsePaginationFromQuery(q url.Values) Pagination {
	var p Pagination

	pageStr := q.Get("page")
	limitStr := q.Get("limit")

	page, pageErr := strconv.Atoi(pageStr)
	if pageErr != nil || page < 1 {
		page = 1
	}

	limit, limitErr := strconv.Atoi(limitStr)
	if limitErr != nil || limit < 1 {
		limit = 25
	}
	p.Page = page
	p.Limit = limit
	p.Offset = (p.Page - 1) * p.Limit

	return p
}

/// FILTER OF ALL KIND

const (
	fieldsDelimiter = "|"
)

// Statement should be valid SQL for WHERE Clause
type Filters struct {
	Statement string
	Args      []any
}

func ParseFiltersFromQuery(q url.Values) Filters {
	statement := q.Get("filters")
	rawArgs := q.Get("filtersArgs")

	if len(rawArgs) == 0 {
		return Filters{Statement: statement, Args: nil}
	}

	parsedArgs := strings.Split(rawArgs, fieldsDelimiter)
	args := make([]any, len(parsedArgs), len(parsedArgs))

	for i, v := range parsedArgs {
		args[i] = v
	}

	return Filters{Statement: statement, Args: args}
}

func (f *Filters) ToSQL() string {
	if len(f.Statement) == 0 {
		return ""
	}

	return fmt.Sprintf("WHERE %s", f.Statement)
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
		sql += fmt.Sprintf("%s %s", sf.Name, sf.Order)

		if i+1 != len(s) {
			sql += ","
		}
	}

	return sql
}
