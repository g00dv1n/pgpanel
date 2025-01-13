package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/g00dv1n/pgpanel/core"
)

func getRowsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")
		params := core.ParseGetRowsParamsFromQuery(r.URL.Query())

		rows, err := app.CrudService.GetRows(tableName, &params)

		if err != nil {
			return mapDataError(err)
		}

		return WriteJson(w, rows)
	}
}
func insertRowHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")

		var row core.RawRow
		if err := json.NewDecoder(r.Body).Decode(&row); err != nil {
			return mapDataError(err)
		}

		rows, err := app.CrudService.InsertRow(tableName, row)

		if err != nil {
			return mapDataError(err)
		}

		return WriteJson(w, rows)
	}
}

func updateRowsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")
		filters := core.ParseFiltersFromQuery(r.URL.Query())

		var row core.RawRow
		if err := json.NewDecoder(r.Body).Decode(&row); err != nil {
			return mapDataError(err)
		}

		rows, err := app.CrudService.UpdateRows(tableName, filters, row)

		if err != nil {
			return mapDataError(err)
		}

		return WriteJson(w, rows)
	}
}

func deleteRowsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		tableName := r.PathValue("table")
		filters := core.ParseFiltersFromQuery(r.URL.Query())

		rows, err := app.CrudService.DeleteRows(tableName, filters)

		if err != nil {
			return mapDataError(err)
		}

		return WriteJson(w, rows)
	}
}

func getRelatedRowsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		mainTable := r.PathValue("mainTable")
		id := r.PathValue("mainTableRowId")

		relationTable := r.URL.Query().Get("relationTable")
		if relationTable == "" {
			return NewApiError(http.StatusBadRequest, errors.New("empty relationTable query param"))
		}

		joinTable := r.URL.Query().Get("joinTable")
		if joinTable == "" {
			return NewApiError(http.StatusBadRequest, errors.New("empty joinTable query param"))
		}

		rows, err := app.CrudService.GetRelatedRows(&core.RelationsConfig{
			MainTable:     mainTable,
			RelationTable: relationTable,
			JoinTable:     joinTable,
		}, id)

		if err != nil {
			return mapDataError(err)
		}

		return WriteJson(w, rows)
	}
}

func updateRelatedRowsHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		mainTable := r.PathValue("mainTable")
		id := r.PathValue("mainTableRowId")

		relationTable := r.URL.Query().Get("relationTable")
		if relationTable == "" {
			return NewApiError(http.StatusBadRequest, errors.New("empty relationTable query param"))
		}

		joinTable := r.URL.Query().Get("joinTable")
		if joinTable == "" {
			return NewApiError(http.StatusBadRequest, errors.New("empty joinTable query param"))
		}

		var actions core.UpdateRelatedRowsActions
		if err := json.NewDecoder(r.Body).Decode(&actions); err != nil {
			return mapDataError(err)
		}

		err := app.CrudService.UpdateRelatedRows(&core.RelationsConfig{
			MainTable:     mainTable,
			RelationTable: relationTable,
			JoinTable:     joinTable,
		}, id, &actions)

		if err != nil {
			return mapDataError(err)
		}

		return WriteJson(w, `{"succes": true}`)
	}
}

// helper to proccess all CRUD related errors
func mapDataError(err error) ApiError {
	if errors.Is(err, core.ErrUnknownTable) {
		return NewApiError(http.StatusNotFound, err)
	}

	return NewApiError(http.StatusBadRequest, err)
}
