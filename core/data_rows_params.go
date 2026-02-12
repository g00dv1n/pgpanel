package core

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
)

const (
	SelectColumnsQK   = "selectCols"
	TextFiltersQK     = "textFilters"
	TextFiltersColsQK = "textFiltersCols"
	FiltersQK         = "filters"
	FiltersArgsQK     = "filtersArgs"
	OffsetQK          = "offset"
	LimitQK           = "limit"
	SortQK            = "sort"

	QueryArgsDelimiter = "|"

	DefaultPaginationLimit = 50

	SortingOrderASC  = "ASC"
	SortingOrderDESC = "DESC"
)

// ---------------------- General Filters Interface -------------------------------

type Filters struct {
	TextSearch *TextSearchFilters
	SQL        *SQLFilters
}

// Parse Filters
func ParseFiltersFromQuery(q url.Values) Filters {
	textFilters := q.Get(TextFiltersQK)

	if len(textFilters) > 0 {
		var cols []string
		if colsRaw := q.Get(TextFiltersColsQK); colsRaw != "" {
			cols = strings.Split(colsRaw, QueryArgsDelimiter)
		}

		return Filters{TextSearch: &TextSearchFilters{Text: textFilters, Cols: cols}, SQL: nil}
	}

	filters := q.Get(FiltersQK)
	rawArgs := q.Get(FiltersArgsQK)

	sql := ParseSQLFilters(filters, rawArgs)
	return Filters{
		SQL:        &sql,
		TextSearch: nil,
	}
}

func ParseSQLFilters(statement string, rawArgs string) SQLFilters {
	if len(rawArgs) == 0 {
		return SQLFilters{Statement: statement, Args: nil}
	}

	parsedArgs := strings.Split(rawArgs, QueryArgsDelimiter)
	args := make([]any, len(parsedArgs))

	for i, v := range parsedArgs {
		args[i] = v
	}

	return SQLFilters{Statement: statement, Args: args}
}

func (f Filters) ToSQL(t *Table) (string, []any) {
	if f.TextSearch != nil {
		return f.TextSearch.ToSQL(t)
	}

	if f.SQL != nil {
		return f.SQL.ToSQL(t)
	}

	return "", nil // No filters set
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
	Cols []string
}

func (f TextSearchFilters) ToSQL(t *Table) (string, []any) {
	var filterCols []Column
	var textColsExps []string

	// use specifed cols or by default use all text cols
	if len(f.Cols) > 0 {
		filterCols = t.GetColumns(f.Cols)
	} else {
		for _, col := range t.Columns {
			if col.IsText {
				filterCols = append(filterCols, col)
			}
		}
	}

	for _, col := range filterCols {
		textColsExps = append(textColsExps, fmt.Sprintf(`"%s"::text ILIKE $1`, col.Name))
	}

	if len(textColsExps) == 0 {
		return "WHERE FALSE", nil
	}

	pattern := "%" + strings.ToLower(f.Text) + "%"
	sql := "WHERE " + strings.Join(textColsExps, " OR ")

	return sql, []any{pattern}
}

// ---------------------- Select Columns -------------------------------

// we need to specify which columns we want to get
// if empty we will use all
type SelectColumns []string

// ParseColumnsFromQuery extracts requested columns: ?cols=id|name|email
func ParseSelectColumnsFromQuery(q url.Values) SelectColumns {
	raw := q.Get(SelectColumnsQK)
	if raw == "" {
		return nil
	}

	colsParsed := strings.Split(raw, QueryArgsDelimiter)

	if len(colsParsed) == 0 {
		return nil
	}

	return SelectColumns(colsParsed)
}

func (c SelectColumns) IsEmpty() bool {
	return len(c) == 0
}

// ToSQL validates against the schema and returns the SELECT clause
func (c SelectColumns) ToSQL(t *Table) string {
	cols := t.GetColumns(c)

	// use all if empty
	if len(cols) == 0 {
		cols = t.Columns
	}

	var safeNames []string

	for _, col := range cols {
		safeNames = append(safeNames, col.SafeName())
	}

	return strings.Join(safeNames, ", ")
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
	SelectColumns SelectColumns
	Filters       Filters
	Pagination    Pagination
	Sorting       Sorting
}

func DefaultGetRowsParams() *GetRowsParams {
	return &GetRowsParams{
		Pagination:    Pagination{Limit: DefaultPaginationLimit, Offset: 0},
		Filters:       Filters{},
		SelectColumns: SelectColumns{},
		Sorting:       Sorting{},
	}
}

// Parse GetRowsParams with combined ParseFiltersFromQuery, ParsePaginationFromQuery, ParseSortingFromQuery
func ParseGetRowsParamsFromQuery(q url.Values) GetRowsParams {
	return GetRowsParams{
		Filters:       ParseFiltersFromQuery(q),
		SelectColumns: ParseSelectColumnsFromQuery(q),
		Pagination:    ParsePaginationFromQuery(q),
		Sorting:       ParseSortingFromQuery(q),
	}
}
