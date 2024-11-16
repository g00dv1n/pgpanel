package core

import (
	"fmt"
	"net/url"
	"regexp"
	"strconv"
	"strings"
)

const (
	fieldsDelimiter = "|"
)

// ---------------------- General Filters Interface -------------------------------
type Filters interface {
	ToSQL(table *Table) (string, []any)
}

func ParseFiltersFromQuery(q url.Values) Filters {
	filters := q.Get("filters")
	rawArgs := q.Get("filtersArgs")

	if len(filters) > 0 && !hasSQLWhereClauseOperators(filters) {
		return TextSearchFilters{Text: filters}
	}
	return ParseSQLFilters(filters, rawArgs)
}

func hasSQLWhereClauseOperators(input string) bool {
	// Define a refined regex pattern to match SQL operators used in WHERE clauses.
	// This includes common operators, accounting for variations in spacing and boundaries.
	pattern := `(?i)(=|<>|!=|<|>|<=|>=|\s+AND\s+|\s+OR\s+|LIKE|ILIKE|\s+IN\s*\(|\s+BETWEEN\s+|IS NULL|IS NOT NULL)`

	// Compile the regex pattern.
	regex := regexp.MustCompile(pattern)

	// Check if the pattern matches any part of the input string.
	return regex.MatchString(input)
}

// ---------------------- SQLFilters -------------------------------
type SQLFilters struct {
	Statement string
	Args      []any
}

func ParseSQLFilters(statement string, rawArgs string) SQLFilters {
	if len(rawArgs) == 0 {
		return SQLFilters{Statement: statement, Args: nil}
	}

	parsedArgs := strings.Split(rawArgs, fieldsDelimiter)
	args := make([]any, len(parsedArgs), len(parsedArgs))

	for i, v := range parsedArgs {
		args[i] = v
	}

	return SQLFilters{Statement: statement, Args: args}
}

func (f SQLFilters) ToSQL(t *Table) (string, []any) {
	if len(f.Statement) == 0 {
		return "", nil
	}

	return fmt.Sprintf("WHERE %s", f.Statement), f.Args
}

// ---------------------- TextSearchFilters -------------------------------
type TextSearchFilters struct {
	Text string
}

func (f TextSearchFilters) ToSQL(t *Table) (string, []any) {
	var textColsExps []string

	for _, col := range t.Columns {
		if col.DataTypeCategory == TextType || col.DataTypeCategory == CharacterType {
			textColsExps = append(textColsExps, fmt.Sprintf(`"%s" ILIKE $1`, col.Name))
		}
	}

	if len(textColsExps) == 0 {
		return "", nil
	}

	pattern := "%" + strings.ToLower(f.Text) + "%"
	sql := "WHERE " + strings.Join(textColsExps, " OR ")

	return sql, []any{pattern}
}

// ---------------------- Pagination -------------------------------
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

// ---------------------- Sorting -------------------------------
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

// ---------------------- Composite types -------------------------------
type GetRowsParams struct {
	Filters    Filters
	Pagination Pagination
	Sorting    Sorting
}

func ParseGetRowsParamsFromQuery(q url.Values) GetRowsParams {
	return GetRowsParams{
		Filters:    ParseFiltersFromQuery(q),
		Pagination: ParsePaginationFromQuery(q),
		Sorting:    ParseSortingFromQuery(q),
	}
}
