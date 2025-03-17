package core

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

type LocalStorage struct {
	uploadDir        string
	uploadKeyPattern string
}

func NewLocalStorage(uploadDir, uploadKeyPattern string) (*LocalStorage, error) {
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

	return &LocalStorage{uploadDir: absPath, uploadKeyPattern: uploadKeyPattern}, nil
}

func (l *LocalStorage) Upload(fileName string, file io.Reader) (*StorageFileInfo, error) {
	safeFileName := FileNameWithTs(fileName)
	fullPath := filepath.Join(l.uploadDir, safeFileName)
	outFile, err := os.Create(fullPath)
	if err != nil {
		return nil, err
	}
	defer outFile.Close()

	_, err = io.Copy(outFile, file)
	if err != nil {
		return nil, err
	}

	sfi := StorageFileInfo{
		Name:        safeFileName,
		IsDir:       false,
		IsImage:     IsImageFile(fileName),
		InternalUrl: fmt.Sprintf("/api/files/%s", safeFileName),
	}
	sfi.UploadKey = UploadKey(sfi.Name, l.uploadKeyPattern)

	return &sfi, nil
}

func (l *LocalStorage) List(directory string, pagination Pagination, searchTerm string) ([]StorageFileInfo, error) {
	fullPath := filepath.Join(l.uploadDir, directory)
	files, err := os.ReadDir(fullPath)
	if err != nil {
		return nil, err
	}

	var fileInfos []StorageFileInfo

	// Filter by search term first (case insensitive)
	searchTermLower := strings.ToLower(searchTerm)
	for _, file := range files {
		if searchTerm != "" && !strings.Contains(strings.ToLower(file.Name()), searchTermLower) {
			continue
		}

		fi, err := file.Info()
		if err != nil {
			continue
		}

		sfi := StorageFileInfo{
			Name:    filepath.Join(directory, file.Name()),
			ModTime: fi.ModTime().Unix(),
			IsDir:   file.IsDir(),
		}

		sfi.InternalUrl = filepath.Join("/api/files", sfi.Name)
		sfi.UploadKey = UploadKey(sfi.Name, l.uploadKeyPattern)

		if !sfi.IsDir {
			sfi.IsImage = IsImageFile(sfi.Name)
		}

		fileInfos = append(fileInfos, sfi)
	}

	if pagination.Offset >= len(fileInfos) {
		return []StorageFileInfo{}, nil
	}

	// Sort by ModTime DESC
	slices.SortFunc(fileInfos, func(a, b StorageFileInfo) int {
		return int(b.ModTime - a.ModTime)
	})

	// Apply pagination
	end := pagination.Offset + pagination.Limit
	if end > len(fileInfos) {
		end = len(fileInfos)
	}

	return fileInfos[pagination.Offset:end], nil
}

func (l *LocalStorage) Get(fileName string) (io.ReadCloser, error) {
	fullPath := filepath.Join(l.uploadDir, fileName)
	return os.Open(fullPath)
}

func (l *LocalStorage) Delete(fileName string) error {
	fullPath := filepath.Join(l.uploadDir, fileName)
	return os.Remove(fullPath)
}

func (l *LocalStorage) Export(w io.Writer) error {
	// Create a new zip writer using the provided io.Writer
	zipWriter := zip.NewWriter(w)
	defer zipWriter.Close()

	// Walk through the directory
	err := filepath.Walk(l.uploadDir, func(filePath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories (we only want to add files)
		if info.IsDir() {
			return nil
		}

		// Create a zip header based on the file info
		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}

		// Set the name relative to the source directory
		relPath, err := filepath.Rel(l.uploadDir, filePath)
		if err != nil {
			return err
		}
		header.Name = relPath

		// Create the file in the zip archive
		fileWriter, err := zipWriter.CreateHeader(header)
		if err != nil {
			return err
		}

		// Open the source file
		sourceFile, err := os.Open(filePath)
		if err != nil {
			return err
		}
		defer sourceFile.Close()

		// Copy the file contents to the zip archive
		_, err = io.Copy(fileWriter, sourceFile)
		return err
	})

	return err
}
