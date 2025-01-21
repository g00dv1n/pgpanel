package main

import (
	"github.com/g00dv1n/pgpanel"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	pgpanel.NewWithEnv().ProcessCommands()
}
