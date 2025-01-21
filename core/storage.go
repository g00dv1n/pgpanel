package core

import (
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"
)

type Storage interface {
	Upload(fileName string, file io.Reader) (*StorageFileInfo, error)
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

func FileNameWithTs(fileName string) string {
	ts := time.Now().Unix()

	ext := filepath.Ext(fileName)
	nameWithoutExt := strings.TrimSuffix(fileName, ext)

	return fmt.Sprintf("%s_%d%s", nameWithoutExt, ts, ext)
}
