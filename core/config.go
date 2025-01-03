package core

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	DefaultSchemaName = "public"
)

type Config struct {
	// required DatabaseUrl or Pool, SecretKey
	DatabaseUrl string
	Pool        *pgxpool.Pool
	SecretKey   string

	// optional fields
	Logger         *slog.Logger
	SchemaName     string
	IncludedTables []string
}

func ParseConfigFromEnv() (*Config, error) {
	var config Config

	config.DatabaseUrl = os.Getenv("DATABASE_URL")

	if config.DatabaseUrl == "" {
		return nil, errors.New("empty DATABASE_URL env")
	}

	config.SecretKey = os.Getenv("SECRET_KEY")

	if config.SecretKey == "" {
		return nil, errors.New("empty SECRET_KEY env")
	}

	config.SchemaName = os.Getenv("SCHEMA_NAME")

	includedTablesEnv := os.Getenv("INCLUDED_TABLES")
	if len(includedTablesEnv) > 0 {
		config.IncludedTables = strings.Split(includedTablesEnv, ",")
	}

	return &config, nil
}

func (c *Config) GetPool() (*pgxpool.Pool, error) {
	ctx := context.Background()

	var pool *pgxpool.Pool
	var err error

	if c.Pool != nil {
		pool = c.Pool
	} else {
		pool, err = pgxpool.New(ctx, c.DatabaseUrl)
	}

	return pool, err
}

func (c *Config) GetSchemaName() string {
	if c.SchemaName == "" {
		return DefaultSchemaName
	}

	return c.SchemaName
}

func (c *Config) GetLogger() *slog.Logger {
	if c.Logger != nil {
		return c.Logger
	}

	return DefaultLogger()
}

func DefaultLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stdout, nil))
}
