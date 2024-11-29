package api

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/g00dv1n/pgpanel/db"
)

// ---------------- Query Keys For parsing Filter, Pagination and Sorting -----------------
const (
	TextFiltersQK = "textFilters"
	FiltersQK     = "filters"
	FiltersArgsQK = "filtersArgs"
	OffsetQK      = "offset"
	LimitQK       = "limit"
	SortQK        = "sort"

	QueryArgsDelimiter = "|"
)

// ---------------------- Parse Filters -------------------------------
func ParseFiltersFromQuery(q url.Values) db.Filters {
	textFilters := q.Get(TextFiltersQK)

	if len(textFilters) > 0 {
		return db.TextSearchFilters{Text: textFilters}
	}

	filters := q.Get(FiltersQK)
	rawArgs := q.Get(FiltersArgsQK)

	return ParseSQLFilters(filters, rawArgs)
}

func ParseSQLFilters(statement string, rawArgs string) db.SQLFilters {
	if len(rawArgs) == 0 {
		return db.SQLFilters{Statement: statement, Args: nil}
	}

	parsedArgs := strings.Split(rawArgs, QueryArgsDelimiter)
	args := make([]any, len(parsedArgs), len(parsedArgs))

	for i, v := range parsedArgs {
		args[i] = v
	}

	return db.SQLFilters{Statement: statement, Args: args}
}

// ---------------------- Parse Pagination -------------------------------
func ParsePaginationFromQuery(q url.Values) db.Pagination {
	offsetStr := q.Get(OffsetQK)
	limitStr := q.Get(LimitQK)

	offset, offsetErr := strconv.Atoi(offsetStr)
	if offsetErr != nil || offset < 0 {
		offset = 0
	}

	limit, limitErr := strconv.Atoi(limitStr)
	if limitErr != nil || limit < 1 {
		limit = db.DefaultPaginationLimit
	}

	return db.Pagination{Offset: offset, Limit: limit}
}

// ---------------------- Parse Sorting -------------------------------
func ParseSortingFromQuery(q url.Values) db.Sorting {
	sort := q.Get(SortQK)

	if len(sort) == 0 {
		return nil
	}

	fieldsRaw := strings.Split(sort, QueryArgsDelimiter)
	fields := make([]db.SortingField, 0, len(fieldsRaw))

	for _, fr := range fieldsRaw {
		if len(fr) == 0 {
			continue
		}

		if strings.HasPrefix(fr, "-") {
			fields = append(fields, db.SortingField{Name: strings.TrimPrefix(fr, "-"), Order: db.SortingOrderDESK})
		} else {
			fields = append(fields, db.SortingField{Name: fr, Order: db.SortingOrderASK})
		}
	}

	return fields
}

// ---------------------- Parse GetRowsParams  -------------------------------
func ParseGetRowsParamsFromQuery(q url.Values) *db.GetRowsParams {
	return &db.GetRowsParams{
		Filters:    ParseFiltersFromQuery(q),
		Pagination: ParsePaginationFromQuery(q),
		Sorting:    ParseSortingFromQuery(q),
	}
}

// ---------------------- Data Handlers -------------------------------
func (app *Handlers) getRowsHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")
	params := ParseGetRowsParamsFromQuery(r.URL.Query())

	rows, err := app.CRUD.GetRows(tableName, params)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	return WriteJson(w, rows)
}

func (app *Handlers) insertRowHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")

	var row db.RawRow
	if err := json.NewDecoder(r.Body).Decode(&row); err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	rows, err := app.CRUD.InsertRow(tableName, row)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	return WriteJson(w, rows)
}

func (app *Handlers) updateRowsHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")
	filters := ParseFiltersFromQuery(r.URL.Query())

	var row db.RawRow
	if err := json.NewDecoder(r.Body).Decode(&row); err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	rows, err := app.CRUD.UpdateRows(tableName, filters, row)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	return WriteJson(w, rows)
}

func (app *Handlers) deleteRowsHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")
	filters := ParseFiltersFromQuery(r.URL.Query())

	rows, err := app.CRUD.DeleteRows(tableName, filters)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	return WriteJson(w, rows)
}
