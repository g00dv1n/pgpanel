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
	Delete(fileName string) error
}

type StorageFileInfo struct {
	Name        string `json:"name"`
	IsDir       bool   `json:"isDir"`
	IsImage     bool   `json:"isImage"`
	ModTime     int64  `json:"modTime"`
	InternalUrl string `json:"internalUrl"`

	UploadKey string `json:"uploadKey,omitempty"`
	PublicUrl string `json:"publicUrl,omitempty"`
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

// pattern like some_prefix/{name}
func UploadKey(name string, pattern string) string {
	return strings.ReplaceAll(pattern, "{name}", name)
}
