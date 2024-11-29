package main

import (
	"github.com/g00dv1n/pgpanel"
)

func main() {
	panel := pgpanel.New("postgres://postgres:qwerty12@localhost/hackers_tools")
	panel.Serve(3333)
}
