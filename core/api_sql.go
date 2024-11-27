package core

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	maxRowsLimit = 500
)

type SQLExecutionRequest struct {
	Query string `json:"query"`
	Args  []any  `json:"args"`
}

type SQLExecutionResponse struct {
	Columns      []string         `json:"columns"`
	Rows         []map[string]any `json:"rows"`
	RowsAffected int64            `json:"rowsAffected"`
}

func (req *SQLExecutionRequest) Execute(db *pgxpool.Pool) (*SQLExecutionResponse, error) {
	if len(req.Query) == 0 {
		return nil, errors.New("empty query")
	}

	ctx := context.Background()
	rows, err := db.Query(ctx, req.Query, req.Args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []map[string]any
	fieldDescriptions := rows.FieldDescriptions()

	var rowsCount int
	for rows.Next() {
		if rowsCount == maxRowsLimit {
			break
		}

		rowValues, err := rows.Values()
		if err != nil {
			return nil, err
		}

		rowMap := make(map[string]any)
		for i, val := range rowValues {
			rowMap[fieldDescriptions[i].Name] = val
		}
		results = append(results, rowMap)

		rowsCount += 1
	}

	// need to close rows before using CommandTag
	rows.Close()
	rowsAffected := rows.CommandTag().RowsAffected()

	columns := make([]string, len(fieldDescriptions))

	for i, fd := range fieldDescriptions {
		columns[i] = fd.Name
	}

	return &SQLExecutionResponse{
		Columns:      columns,
		Rows:         results,
		RowsAffected: rowsAffected,
	}, nil
}

// ---------------------- SQL API Handlers -------------------------------
func (app *App) executeSQLHandler(w http.ResponseWriter, r *http.Request) error {
	var sqlReq SQLExecutionRequest

	if err := json.NewDecoder(r.Body).Decode(&sqlReq); err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	res, err := sqlReq.Execute(app.DB)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	return sendJson(w, res)
}
