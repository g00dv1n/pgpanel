package db

import (
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
)

const (
	DefaultPaginationLimit = 50

	SortingOrderASK  = "ASK"
	SortingOrderDESK = "DESK"
)

// ---------------------- General Filters Interface -------------------------------
type Filters interface {
	ToSQL(table *Table) (string, []any)
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
		if col.OID == pgtype.VarcharOID || col.OID == pgtype.TextOID {
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

// ---------------------- Sorting -------------------------------
type SortingField struct {
	Name  string
	Order string
}
type Sorting []SortingField

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

func DefaultGetRowsParams() *GetRowsParams {
	return &GetRowsParams{
		Pagination: Pagination{Limit: DefaultPaginationLimit, Offset: 0},
		Filters:    SQLFilters{},
		Sorting:    Sorting{},
	}
}
