package main

import (
	"github.com/g00dv1n/pgpanel"
	"github.com/g00dv1n/pgpanel/core"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	config, _ := core.ParseConfigFromEnv()
	panel := pgpanel.NewWithConfig(config)
	panel.Serve(3333)
}
