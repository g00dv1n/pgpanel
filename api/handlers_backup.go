package api

import (
	"encoding/json"
	"net/http"

	"github.com/g00dv1n/pgpanel/core"
)

func exportDatabase(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {

		var options core.ExportDatabaseOptions

		if err := json.NewDecoder(r.Body).Decode(&options); err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		return core.ExportDatabase(app.DB, w, options)
	}
}

func importDatabase(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {

		r.ParseMultipartForm(maxUploadSize)

		file, _, err := r.FormFile("file")
		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}
		defer file.Close()

		return core.ImportDatabase(app.DB, file)
	}
}
