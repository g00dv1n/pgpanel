package api

import (
	"encoding/json"
	"net/http"

	"github.com/g00dv1n/pgpanel/core"
)

func executeSQLHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		var sqlReq core.SQLExecutionRequest

		if err := json.NewDecoder(r.Body).Decode(&sqlReq); err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		res, err := app.ExecuteSQL(&sqlReq)
		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		return WriteJson(w, res)
	}
}
