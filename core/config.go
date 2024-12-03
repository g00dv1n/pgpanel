package core

import (
	"errors"
	"log/slog"
	"os"
)

type Config struct {
	// required
	DatabaseUrl string

	// optional
	LogLevel string
}

func ParseConfigFromEnv() (*Config, error) {
	var config Config

	config.DatabaseUrl = os.Getenv("DATABASE_URL")

	if config.DatabaseUrl == "" {
		return nil, errors.New("empty DATABASE_URL env")
	}

	return &config, nil
}

func DefaultLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stdout, nil))
}
