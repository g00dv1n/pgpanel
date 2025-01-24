package core

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Universal App struct to store important state and different helpers
type App struct {
	DB               *pgxpool.Pool
	Logger           *slog.Logger
	SchemaRepository *SchemaRepository
	AdminRepository  *AdminRepository
	CrudService      *CrudService
	Storage          Storage
	SecretKey        []byte
}

func NewApp(config *Config) *App {
	pool, err := config.GetPool()

	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}

	secretKey := []byte(config.SecretKey)

	logger := config.GetLogger()

	schema, err := NewSchemaRepository(
		pool,
		logger,
		config.GetSchemaName(),
		config.IncludedTables,
	)

	adminRepo := NewAdminRepository(pool, logger)

	if err != nil {
		logger.Error("can't extract tables", "error", err)
		os.Exit(1)
	}

	err = schema.CreateAdminTables()

	if err != nil {
		logger.Error("can't create admin tables", "error", err)
		os.Exit(1)
	}

	crud := NewCrudService(pool, schema, logger)

	localStorage, err := NewLocalStorage(config.UploadDir, config.UploadKeyPattern)
	if err != nil {
		logger.Error("can't create local storage", "error", err)
		os.Exit(1)
	}

	return &App{
		DB:               pool,
		Logger:           logger,
		SchemaRepository: schema,
		AdminRepository:  adminRepo,
		CrudService:      crud,
		Storage:          localStorage,
		SecretKey:        secretKey,
	}
}

func NewAppWithEnvConfig() *App {
	config, err := ParseConfigFromEnv()

	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to parse app config from env %v\n", err)
		os.Exit(1)
	}
	return NewApp(config)
}

// close pool connections and potentially otrher stuff
func (app *App) Close() {
	app.DB.Close()
}

func (app *App) ExecuteSQL(req *SQLExecutionRequest) (*SQLExecutionResponse, error) {
	return req.Execute(app.DB)
}
