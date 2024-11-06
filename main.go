package main

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"github.com/g00dv1n/pgpanel/core"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	connString := "postgres://postgres:qwerty12@localhost/hackers_tools"
	dbpool, err := pgxpool.New(context.Background(), connString)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer dbpool.Close()

	app := core.NewApp(dbpool)
	addr := ":3333"

	app.Logger.Info(fmt.Sprintf("Running server on http://127.0.0.1%s", addr))

	if err := http.ListenAndServe(addr, app.Routes()); err != nil {
		fmt.Fprintf(os.Stderr, "Unable to ListenAndServe: %v\n", err)
		os.Exit(1)
	}
}
