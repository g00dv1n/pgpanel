package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
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
	addr := ":3333"

	app.Logger.Info("Running server on http://127.0.0.1" + addr)
	if err := http.ListenAndServe(addr, app.Routes()); err != nil {
		fmt.Fprintf(os.Stderr, "Unable to ListenAndServe: %v\n", err)
		os.Exit(1)
	}
}

// INIT istance of logger, set it as default accros all program and return pointer to this logger
func InitLogger() *slog.Logger {
	l := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(l)

	return l
}
