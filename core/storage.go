package core

import (
	"io"
	"path/filepath"
	"strings"
)

type Storage interface {
	Upload(fileName string, file io.Reader) error
	List(directory string) ([]StorageFileInfo, error)
	Get(fileName string) (io.ReadCloser, error)
}

type StorageFileInfo struct {
	Name    string `json:"name"`
	IsDir   bool   `json:"isDir"`
	IsImage bool   `json:"isImage"`
}

func IsImageFile(fileName string) bool {
	ext := strings.ToLower(filepath.Ext(fileName))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff":
		return true
	default:
		return false
	}
}
