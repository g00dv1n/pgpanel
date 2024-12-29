package pgpanel

import (
	"fmt"
	"net"
	"net/http"
	"os"

	"github.com/g00dv1n/pgpanel/api"
	"github.com/g00dv1n/pgpanel/core"
	"github.com/g00dv1n/pgpanel/ui"
)

const (
	DefaultHost = "127.0.0.1"
	DefaultPort = "3333"

	CmdServe       = "serve"
	CmdAddAdmin    = "add-admin"
	CmdDeleteAdmin = "delete-admin"
	CmdAdminList   = "admin-list"
)

type PgPanel struct {
	*core.App

	Port string
	Host string

	mux *http.ServeMux
}

func New(app *core.App) *PgPanel {
	mux := http.NewServeMux()

	// Mount all routes
	api.MountRoutes(app, mux, ui.EmbedHandler())

	return &PgPanel{
		App: app,

		Port: DefaultPort,
		Host: DefaultHost,

		mux: mux,
	}
}

func NewWithEnv() *PgPanel {
	app := core.NewAppWithEnvConfig()

	return New(app)
}

// Add a custom router before run Serve
func (panel *PgPanel) AddRoute(pattern string, handler api.ApiHandler, middlewares ...api.ApiMiddleware) {
	panel.mux.Handle(pattern, api.CreateHandler(handler, middlewares...))
}

func (panel *PgPanel) Serve() {
	defer panel.Close()

	addr := net.JoinHostPort(panel.Host, panel.Port)

	panel.Logger.Info("Running server on http://" + addr)
	if err := http.ListenAndServe(addr, panel.mux); err != nil {
		fmt.Fprintf(os.Stderr, "Unable to ListenAndServe: %v\n", err)
		os.Exit(1)
	}
}

// Command line proccesing logic

func (panel *PgPanel) addAdminCommand(args []string) bool {
	if len(args) < 2 {
		fmt.Printf("Usage: %s <username> <password> \n", CmdAddAdmin)
		return false
	}

	username := args[0]
	password := args[1]

	err := panel.AdminRepository.AddAdmin(username, password)

	if err != nil {
		fmt.Println("Can't add admin")
		fmt.Println(err)
		return false
	}

	fmt.Printf("Admin <%s> has been added.\n", username)
	return true
}

func (panel *PgPanel) deleteAdminCommand(args []string) bool {
	if len(args) == 0 {
		fmt.Printf("Usage: %s <username> \n", CmdAddAdmin)
		return false
	}

	username := args[0]
	err := panel.AdminRepository.DeleteAdmin(username)

	if err != nil {
		fmt.Println("Can't delete admin")
		fmt.Println(err)
		return false
	}

	fmt.Printf("Admin <%s> has been deleted.\n", username)
	return true
}

func (panel *PgPanel) adminListCommand(args []string) bool {
	list, err := panel.AdminRepository.GetAdminList()

	if err != nil {
		fmt.Println("Can't get admin list")
		fmt.Println(err)
		return false
	}

	fmt.Printf("Admin List: \n\n")

	fmt.Println("---------------")
	for _, username := range list {
		fmt.Println(username)
		fmt.Println("---------------")
	}
	fmt.Println()
	return true
}

func (panel *PgPanel) serveCommand(args []string) bool {
	panel.Serve()
	return true
}

func (panel *PgPanel) ProcessCommands() {
	args := os.Args[1:] // skip bin name
	// set Serve as default command
	command := CmdServe
	commandArgs := make([]string, 0)

	if len(args) > 0 {
		command = args[0]
	}

	if len(args) > 1 {
		commandArgs = args[1:]
	}

	commands := make(map[string]func([]string) bool)

	commands[CmdAddAdmin] = panel.addAdminCommand
	commands[CmdDeleteAdmin] = panel.deleteAdminCommand
	commands[CmdAdminList] = panel.adminListCommand
	commands[CmdServe] = panel.serveCommand

	if cmd, ok := commands[command]; ok {
		success := cmd(commandArgs)

		if !success {
			os.Exit(1)
		}
	} else {
		fmt.Println("Unknown command:", command)
	}
}
