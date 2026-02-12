package core

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Universal App struct to store important state and different helpers
type App struct {
	DB            *pgxpool.Pool
	Logger        *slog.Logger
	SchemaService *SchemaService
	DataService   *DataService

	AdminService *AdminService

	Storage   Storage
	SecretKey []byte
}

func NewApp(config *Config) *App {
	pool, err := config.GetPool()

	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}

	logger := config.GetLogger()

	schema, err := NewSchemaService(
		pool,
		logger,
		config.GetSchemaName(),
		config.IncludedTables,
	)

	admin := NewAdminService(pool, logger)

	if err != nil {
		logger.Error("can't extract tables", "error", err)
		os.Exit(1)
	}

	err = schema.CreateAdminTables()

	if err != nil {
		logger.Error("can't create admin tables", "error", err)
		os.Exit(1)
	}

	crud := NewDataService(pool, schema, logger)

	localStorage, err := NewLocalStorage(config.UploadDir, config.UploadKeyPattern)
	if err != nil {
		logger.Error("can't create local storage", "error", err)
		os.Exit(1)
	}

	secretKey := config.SecretKey
	if config.isDefaultSecretInUse() {
		logger.Warn("Defalut SECRET is used. Please set a secure one for prod app")
	}

	return &App{
		DB:            pool,
		Logger:        logger,
		SchemaService: schema,
		AdminService:  admin,
		DataService:   crud,
		Storage:       localStorage,
		SecretKey:     secretKey,
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
