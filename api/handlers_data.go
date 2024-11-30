package api

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/g00dv1n/pgpanel/core"
)

// Query Keys For parsing Filter, Pagination and Sorting
const (
	TextFiltersQK = "textFilters"
	FiltersQK     = "filters"
	FiltersArgsQK = "filtersArgs"
	OffsetQK      = "offset"
	LimitQK       = "limit"
	SortQK        = "sort"

	QueryArgsDelimiter = "|"
)

// Parse Filters
func ParseFiltersFromQuery(q url.Values) core.Filters {
	textFilters := q.Get(TextFiltersQK)

	if len(textFilters) > 0 {
		return core.TextSearchFilters{Text: textFilters}
	}

	filters := q.Get(FiltersQK)
	rawArgs := q.Get(FiltersArgsQK)

	return ParseSQLFilters(filters, rawArgs)
}

func ParseSQLFilters(statement string, rawArgs string) core.SQLFilters {
	if len(rawArgs) == 0 {
		return core.SQLFilters{Statement: statement, Args: nil}
	}

	parsedArgs := strings.Split(rawArgs, QueryArgsDelimiter)
	args := make([]any, len(parsedArgs), len(parsedArgs))

	for i, v := range parsedArgs {
		args[i] = v
	}

	return core.SQLFilters{Statement: statement, Args: args}
}

// Parse Pagination
func ParsePaginationFromQuery(q url.Values) core.Pagination {
	offsetStr := q.Get(OffsetQK)
	limitStr := q.Get(LimitQK)

	offset, offsetErr := strconv.Atoi(offsetStr)
	if offsetErr != nil || offset < 0 {
		offset = 0
	}

	limit, limitErr := strconv.Atoi(limitStr)
	if limitErr != nil || limit < 1 {
		limit = core.DefaultPaginationLimit
	}

	return core.Pagination{Offset: offset, Limit: limit}
}

// Parse Sorting
func ParseSortingFromQuery(q url.Values) core.Sorting {
	sort := q.Get(SortQK)

	if len(sort) == 0 {
		return nil
	}

	fieldsRaw := strings.Split(sort, QueryArgsDelimiter)
	fields := make([]core.SortingField, 0, len(fieldsRaw))

	for _, fr := range fieldsRaw {
		if len(fr) == 0 {
			continue
		}

		if strings.HasPrefix(fr, "-") {
			fields = append(fields, core.SortingField{Name: strings.TrimPrefix(fr, "-"), Order: core.SortingOrderDESK})
		} else {
			fields = append(fields, core.SortingField{Name: fr, Order: core.SortingOrderASK})
		}
	}

	return fields
}

// Parse GetRowsParams with combined ParseFiltersFromQuery, ParsePaginationFromQuery, ParseSortingFromQuery
func ParseGetRowsParamsFromQuery(q url.Values) *core.GetRowsParams {
	return &core.GetRowsParams{
		Filters:    ParseFiltersFromQuery(q),
		Pagination: ParsePaginationFromQuery(q),
		Sorting:    ParseSortingFromQuery(q),
	}
}

// ---------------------- Handlers -------------------------------

func getRowsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")
		params := ParseGetRowsParamsFromQuery(r.URL.Query())

		rows, err := app.GetRows(tableName, params)

		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		return WriteJson(w, rows)
	}
}
func insertRowHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")

		var row core.RawRow
		if err := json.NewDecoder(r.Body).Decode(&row); err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		rows, err := app.InsertRow(tableName, row)

		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		return WriteJson(w, rows)
	}
}

func updateRowsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")
		filters := ParseFiltersFromQuery(r.URL.Query())

		var row core.RawRow
		if err := json.NewDecoder(r.Body).Decode(&row); err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		rows, err := app.UpdateRows(tableName, filters, row)

		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		return WriteJson(w, rows)
	}
}

func deleteRowsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")
		filters := ParseFiltersFromQuery(r.URL.Query())

		rows, err := app.DeleteRows(tableName, filters)

		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		return WriteJson(w, rows)
	}
}
