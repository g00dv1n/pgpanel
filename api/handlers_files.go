package api

import (
	"net/http"

	"github.com/g00dv1n/pgpanel/core"
)

const maxUploadSize = 10 * 1024 * 1024

func uploadFileHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		r.ParseMultipartForm(maxUploadSize)

		file, handler, err := r.FormFile("file")
		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}
		defer file.Close()

		uploadInfo, err := app.Storage.Upload(handler.Filename, file)
		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		return WriteJson(w, uploadInfo)
	}
}
