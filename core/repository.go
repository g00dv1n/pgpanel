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

type CrudRepository struct {
	db        *pgxpool.Pool
	tablesMap map[string]*Table
}

func NewCrudRepository(db *pgxpool.Pool, tables []Table) CrudRepository {
	tablesMap := make(map[string]*Table, len(tables))

	for _, t := range tables {
		tablesMap[t.Name] = &t
	}

	return CrudRepository{
		db,
		tablesMap,
	}
}

func (r CrudRepository) GetRows(tableName string, f Filters, p Pagination) (json.RawMessage, error) {
	table := r.tablesMap[tableName]

	if table == nil {
		return json.RawMessage{}, fmt.Errorf("can't lookup table: %s", tableName)
	}

	fullSqlTemplate := `
			WITH q as (%s),
			paginated_q as (%s),
			total_count as (%s)
			SELECT 
				json_build_object(
					'rows', COALESCE(json_agg(row_to_json(paginated_q)), '[]'::json),
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
		`SELECT * FROM "%s" %s`,
		table.Name, f.ToWhereClause(),
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
	err := row.Scan(&data)

	return data, err

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

	parsedArgs := strings.Split(rawArgs, "|")
	args := make([]any, len(parsedArgs), len(parsedArgs))

	for i, v := range parsedArgs {
		args[i] = v
	}

	return Filters{Statement: statement, Args: args}
}

func (f *Filters) ToWhereClause() string {
	if len(f.Statement) == 0 {
		return ""
	}

	return fmt.Sprintf("WHERE %s", f.Statement)
}
