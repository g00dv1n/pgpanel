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

		// Cache non-html files
		if !strings.HasSuffix(filePath, ".html") {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		}

		http.ServeFileFS(w, r, frontendFs, filePath)
	}
}
