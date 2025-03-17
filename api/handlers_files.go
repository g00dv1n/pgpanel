package api

import (
	"io"
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

func getFilesListHandler(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {

		pagination := core.ParsePaginationFromQuery(r.URL.Query())
		search := r.URL.Query().Get("search")

		list, err := app.Storage.List(".", pagination, search)
		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		return WriteJson(w, list)
	}
}

func getFile(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		fileName := r.PathValue("fileName")

		file, err := app.Storage.Get(fileName)
		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}
		defer file.Close()

		w.Header().Add("Cache-Control", "public, immutable, max-age=31536000")
		_, err = io.Copy(w, file)
		return err
	}
}

func deteteFile(app *core.App) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		fileName := r.PathValue("fileName")

		return app.Storage.Delete(fileName)
	}
}
