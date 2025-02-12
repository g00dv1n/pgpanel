package core

import (
	"bytes"
	"context"
	"errors"
	"log/slog"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	DefaultSchemaName = "public"

	DefaultSecret = "DO-NOT-USE-IN-PROD"
)

type Config struct {
	// required DatabaseUrl or Pool, SecretKey
	DatabaseUrl string
	Pool        *pgxpool.Pool

	// optional but need to be set for prod
	SecretKey []byte

	// optional fields
	Logger           *slog.Logger
	SchemaName       string
	IncludedTables   []string
	UploadDir        string
	UploadKeyPattern string
}

func ParseConfigFromEnv() (*Config, error) {
	var config Config

	config.DatabaseUrl = os.Getenv("DATABASE_URL")

	if config.DatabaseUrl == "" {
		return nil, errors.New("empty DATABASE_URL env")
	}

	config.SecretKey = SecretFromEnv()

	config.SchemaName = os.Getenv("SCHEMA_NAME")

	includedTablesEnv := os.Getenv("INCLUDED_TABLES")
	if len(includedTablesEnv) > 0 {
		config.IncludedTables = strings.Split(includedTablesEnv, ",")
	}

	config.UploadDir = os.Getenv("UPLOAD_DIR")

	if config.UploadDir == "" {
		config.UploadDir = "upload"
	}

	config.UploadKeyPattern = os.Getenv("UPLOAD_KEY_PATTERN")

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

func (c *Config) isDefaultSecretInUse() bool {
	return bytes.Equal(c.SecretKey, []byte(DefaultSecret))
}

func SecretFromEnv() []byte {
	secret := os.Getenv("SECRET_KEY")

	if secret == "" {
		secret = DefaultSecret
	}

	return []byte(secret)
}

func DefaultLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stdout, nil))
}
