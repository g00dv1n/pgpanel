package core

import (
	"fmt"
	"net/url"
	"regexp"
	"strings"
)

const (
	fieldsDelimiter = "|"
)

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
	// Define a regular expression pattern to match SQL operators used in WHERE clauses.
	// This includes typical comparison and logical operators.
	pattern := `(?i)\b(=|<>|!=|<|>|<=|>=|AND|OR|LIKE|ILIKE|IN|BETWEEN|IS NULL|IS NOT NULL)\b`

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
	var textCols []string

	for _, col := range t.Columns {
		if col.DataTypeCategory == TextType || col.DataTypeCategory == CharacterType {
			textCols = append(textCols, col.Name)
		}
	}

	if len(textCols) == 0 {
		return "", nil
	}

	args := []any{"%" + strings.ToLower(f.Text) + "%"}

	sql := "WHERE "

	for i, colName := range textCols {
		sql += fmt.Sprintf("%s ILIKE $1", colName)

		if i+1 != len(textCols) {
			sql += " OR "
		}
	}

	return sql, args
}
