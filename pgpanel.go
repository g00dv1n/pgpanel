package pgpanel

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

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
	CmdGenJwt      = "gen-jwt"
	CmdGenSecret   = "gen-secret"
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
	panel := New(app)

	envPort := os.Getenv("PORT")
	envHost := os.Getenv("HOST")

	if envPort != "" {
		panel.Port = envPort
	}

	if envHost != "" {
		panel.Host = envHost
	}

	return panel
}

// Add a custom router before run Serve
func (panel *PgPanel) AddRoute(pattern string, handler api.ApiHandler, middlewares ...api.ApiMiddleware) {
	panel.mux.Handle(pattern, api.CreateHandler(handler, middlewares...))
}

func (panel *PgPanel) Serve() {
	defer panel.Close()

	srv := &http.Server{
		Addr:    net.JoinHostPort(panel.Host, panel.Port),
		Handler: panel.mux,
	}

	serverErrors := make(chan error, 1)

	// Start server in a goroutine
	go func() {
		panel.Logger.Info("Running server on http://" + srv.Addr)
		serverErrors <- srv.ListenAndServe()
	}()

	// Channel to listen for interrupt signals
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, syscall.SIGINT, syscall.SIGTERM)

	// Block until shutdown
	select {
	case err := <-serverErrors:
		panel.Logger.Error("Could not start server", "error", err)
		return
	case sig := <-shutdown:
		panel.Logger.Info("Shutdown", "signal", sig)

		// Create shutdown context with timeout
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		// Attempt graceful shutdown
		if err := srv.Shutdown(ctx); err != nil {
			panel.Logger.Error("Could not stop server gracefully", "error", err)

			// Force shutdown
			if err := srv.Close(); err != nil {
				panel.Logger.Error("Could not force close server", "error", err)
			}
		}
	}
}

// ---------------------- COMMANDS -------------------------------

func addAdminCommand(args []string) bool {
	if len(args) < 2 {
		fmt.Printf("Usage: %s <username> <password> \n", CmdAddAdmin)
		return false
	}
	panel := NewWithEnv()

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

func deleteAdminCommand(args []string) bool {
	if len(args) == 0 {
		fmt.Printf("Usage: %s <username> \n", CmdAddAdmin)
		return false
	}
	panel := NewWithEnv()

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

func adminListCommand(args []string) bool {
	panel := NewWithEnv()
	list, err := panel.AdminRepository.GetAdminList()

	if err != nil {
		fmt.Println("Can't get admin list")
		fmt.Println(err)
		return false
	}

	fmt.Printf("Admin List: \n\n")

	fmt.Println("---------------")
	for i, username := range list {
		fmt.Printf("%d. %s \n", i+1, username)
	}
	fmt.Println()
	return true
}

func serveCommand(args []string) bool {
	NewWithEnv().Serve()
	return true
}

func genJwtCommand(args []string) bool {
	panel := NewWithEnv()

	token, err := core.GenerateJwtToken("dev", panel.SecretKey, 24*time.Hour)
	if err != nil {
		fmt.Println("Can't generate jwt")
		fmt.Println(err)
		return false
	}

	fmt.Println(token)
	return true
}

func genSecretCommand(args []string) bool {
	secret, err := core.GenerateSecureSecret(32)
	if err != nil {
		fmt.Println("Can't generate secret")
		fmt.Println(err)
		return false
	}

	fmt.Println(secret)
	return true
}

func ProcessCommands() {
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

	commands[CmdAddAdmin] = addAdminCommand
	commands[CmdDeleteAdmin] = deleteAdminCommand
	commands[CmdAdminList] = adminListCommand
	commands[CmdServe] = serveCommand
	commands[CmdGenJwt] = genJwtCommand
	commands[CmdGenSecret] = genSecretCommand

	if cmd, ok := commands[command]; ok {
		success := cmd(commandArgs)

		if !success {
			os.Exit(1)
		}
	} else {
		fmt.Println("Unknown command:", command)
	}
}
