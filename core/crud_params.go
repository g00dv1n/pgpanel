package core

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
)

const (
	TextFiltersQK = "textFilters"
	FiltersQK     = "filters"
	FiltersArgsQK = "filtersArgs"
	OffsetQK      = "offset"
	LimitQK       = "limit"
	SortQK        = "sort"

	QueryArgsDelimiter = "|"

	DefaultPaginationLimit = 50

	SortingOrderASC  = "ASC"
	SortingOrderDESC = "DESC"
)

// ---------------------- General Filters Interface -------------------------------

type Filters interface {
	ToSQL(table *Table) (string, []any)
}

// Parse Filters
func ParseFiltersFromQuery(q url.Values) Filters {
	textFilters := q.Get(TextFiltersQK)

	if len(textFilters) > 0 {
		return TextSearchFilters{Text: textFilters}
	}

	filters := q.Get(FiltersQK)
	rawArgs := q.Get(FiltersArgsQK)

	return ParseSQLFilters(filters, rawArgs)
}

func ParseSQLFilters(statement string, rawArgs string) SQLFilters {
	if len(rawArgs) == 0 {
		return SQLFilters{Statement: statement, Args: nil}
	}

	parsedArgs := strings.Split(rawArgs, QueryArgsDelimiter)
	args := make([]any, len(parsedArgs), len(parsedArgs))

	for i, v := range parsedArgs {
		args[i] = v
	}

	return SQLFilters{Statement: statement, Args: args}
}

// ---------------------- SQLFilters -------------------------------

type SQLFilters struct {
	Statement string
	Args      []any
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
		if col.IsText {
			textColsExps = append(textColsExps, fmt.Sprintf(`"%s" ILIKE $1`, col.Name))
		}
	}

	if len(textColsExps) == 0 {
		return "WHERE FALSE", nil
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

// Parse Pagination
func ParsePaginationFromQuery(q url.Values) Pagination {
	offsetStr := q.Get(OffsetQK)
	limitStr := q.Get(LimitQK)

	offset, offsetErr := strconv.Atoi(offsetStr)
	if offsetErr != nil || offset < 0 {
		offset = 0
	}

	limit, limitErr := strconv.Atoi(limitStr)
	if limitErr != nil || limit < 1 {
		limit = DefaultPaginationLimit
	}

	return Pagination{Offset: offset, Limit: limit}
}

// ---------------------- Sorting -------------------------------

type SortingField struct {
	Name  string
	Order string
}
type Sorting struct {
	Fields []SortingField
}

// Parse Sorting
func ParseSortingFromQuery(q url.Values) Sorting {
	sort := q.Get(SortQK)

	if len(sort) == 0 {
		return Sorting{}
	}

	fieldsRaw := strings.Split(sort, QueryArgsDelimiter)
	fields := make([]SortingField, 0, len(fieldsRaw))

	for _, fr := range fieldsRaw {
		if len(fr) == 0 {
			continue
		}

		if strings.HasPrefix(fr, "-") {
			fields = append(fields, SortingField{Name: strings.TrimPrefix(fr, "-"), Order: SortingOrderDESC})
		} else {
			fields = append(fields, SortingField{Name: fr, Order: SortingOrderASC})
		}
	}

	return Sorting{Fields: fields}
}

func DefaultTableSorting(table *Table) Sorting {
	var f SortingField

	for _, col := range table.Columns {
		if col.IsPrimaryKey {
			f.Name = col.Name
			f.Order = SortingOrderASC

			break
		}
	}

	// handle edge case when table doesn't have primary keys
	if len(f.Name) == 0 {
		return Sorting{}
	}

	return Sorting{Fields: []SortingField{f}}
}

func (s Sorting) IsEmpty() bool {
	return len(s.Fields) == 0
}

func (s Sorting) ToSQL() string {
	if s.IsEmpty() {
		return ""
	}

	sql := "ORDER BY "

	for i, sf := range s.Fields {
		sql += fmt.Sprintf(`"%s" %s`, sf.Name, sf.Order)

		if i+1 != len(s.Fields) {
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

func DefaultGetRowsParams() *GetRowsParams {
	return &GetRowsParams{
		Pagination: Pagination{Limit: DefaultPaginationLimit, Offset: 0},
		Filters:    SQLFilters{},
		Sorting:    Sorting{},
	}
}

// Parse GetRowsParams with combined ParseFiltersFromQuery, ParsePaginationFromQuery, ParseSortingFromQuery
func ParseGetRowsParamsFromQuery(q url.Values) GetRowsParams {
	return GetRowsParams{
		Filters:    ParseFiltersFromQuery(q),
		Pagination: ParsePaginationFromQuery(q),
		Sorting:    ParseSortingFromQuery(q),
	}
}
