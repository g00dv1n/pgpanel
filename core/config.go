package core

import (
	"errors"
	"log/slog"
	"os"
)

const (
	DefaultHost = "127.0.0.1"
	DefaultPort = "3333"
)

type Config struct {
	// required
	DatabaseUrl string

	// optional
	LogLevel   string
	ServerPort string
	ServerHost string
}

func ParseConfigFromEnv() (*Config, error) {
	var config Config

	config.DatabaseUrl = os.Getenv("DATABASE_URL")

	if config.DatabaseUrl == "" {
		return nil, errors.New("empty DATABASE_URL env")
	}

	config.ServerHost = os.Getenv("HOST")
	if config.ServerHost == "" {
		config.ServerHost = DefaultHost
	}

	config.ServerPort = os.Getenv("PORT")
	if config.ServerPort == "" {
		config.ServerPort = DefaultPort
	}

	return &config, nil
}

func DefaultLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stdout, nil))
}
