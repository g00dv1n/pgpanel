package core

import (
	"io"
	"os"
	"path/filepath"
)

type LocalStorage struct {
	uploadDir string
}

func NewLocalStorage(uploadDir string) (*LocalStorage, error) {
	absPath, err := filepath.Abs(uploadDir)
	if err != nil {
		return nil, err
	}

	// Check if directory exists
	if _, err := os.Stat(absPath); os.IsNotExist(err) {
		// Create the directory if it doesn't exist
		if err := os.MkdirAll(absPath, os.ModePerm); err != nil {
			return nil, err
		}
	}

	return &LocalStorage{uploadDir: absPath}, nil
}

func (l *LocalStorage) Upload(fileName string, file io.Reader) error {
	fullPath := filepath.Join(l.uploadDir, fileName)
	outFile, err := os.Create(fullPath)
	if err != nil {
		return err
	}
	defer outFile.Close()

	_, err = io.Copy(outFile, file)
	return err
}

func (l *LocalStorage) List(directory string) ([]StorageFileInfo, error) {
	fullPath := filepath.Join(l.uploadDir, directory)
	files, err := os.ReadDir(fullPath)
	if err != nil {
		return nil, err
	}

	var fileNames []StorageFileInfo
	for _, file := range files {
		fi := StorageFileInfo{
			Name:  filepath.Join(directory, file.Name()),
			IsDir: file.IsDir(),
		}

		if !fi.IsDir {
			fi.IsImage = IsImageFile(fi.Name)
		}

		fileNames = append(fileNames, fi)
	}
	return fileNames, nil
}

func (l *LocalStorage) Get(fileName string) (io.ReadCloser, error) {
	fullPath := filepath.Join(l.uploadDir, fileName)
	return os.Open(fullPath)
}
