package main

import (
	"os"

	"github.com/g00dv1n/pgpanel"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	panel := pgpanel.New(os.Getenv("DATABASE_URL"))
	panel.Serve(3333)
}
