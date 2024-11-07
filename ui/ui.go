package ui

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"
)

//go:embed all:dist
var reactFiles embed.FS

func Handler() http.HandlerFunc {
	frontendFs, _ := fs.Sub(reactFiles, "dist")

	return func(w http.ResponseWriter, r *http.Request) {
		filePath := strings.TrimPrefix(r.URL.Path, "/")

		// Return asset file or index.html
		if _, err := frontendFs.Open(filePath); err != nil {
			filePath = "index.html"
		}

		http.ServeFileFS(w, r, frontendFs, filePath)
	}
}
