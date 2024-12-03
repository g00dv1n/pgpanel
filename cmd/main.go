package main

import (
	"github.com/g00dv1n/pgpanel"
	"github.com/g00dv1n/pgpanel/core"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	app := core.NewAppWithEnvConfig()

	pgpanel.New(app).Serve()
}
