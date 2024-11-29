package api

import (
	"encoding/json"
	"net/http"

	"github.com/g00dv1n/pgpanel/db"
)

func (app *Handlers) executeSQLHandler(w http.ResponseWriter, r *http.Request) error {
	var sqlReq db.SQLExecutionRequest

	if err := json.NewDecoder(r.Body).Decode(&sqlReq); err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	res, err := sqlReq.Execute(app.DB)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	return WriteJson(w, res)
}
