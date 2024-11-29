package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"

	"github.com/g00dv1n/pgpanel/core"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	logger := InitLogger()

	connString := "postgres://postgres:qwerty12@localhost/hackers_tools"
	dbpool, err := pgxpool.New(context.Background(), connString)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer dbpool.Close()

	app := core.NewApp(dbpool, logger)

	app.Serve(3333)
}

// INIT istance of logger, set it as default accros all program and return pointer to this logger
func InitLogger() *slog.Logger {
	l := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(l)

	return l
}
