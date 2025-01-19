package main

import (
	"fmt"

	"github.com/g00dv1n/pgpanel"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	panel := pgpanel.NewWithEnv()

	list, _ := panel.Storage.List(".")

	fmt.Println(list)
}
