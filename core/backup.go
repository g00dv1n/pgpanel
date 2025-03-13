package core

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"os/exec"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type cmdEnv struct {
	vars []string
}

func (env *cmdEnv) add(key string, value any) {
	env.vars = append(env.vars, fmt.Sprintf("%s=%v", key, value))
}

func cmdEnvFromConfig(config *pgx.ConnConfig) cmdEnv {
	var env cmdEnv
	env.vars = os.Environ()

	env.add("PGHOST", config.Host)
	env.add("PGPORT", config.Port)
	env.add("PGUSER", config.User)

	if config.Password != "" {
		env.add("PGPASSWORD", config.Password)
	}

	return env
}

type ExportDatabaseOptions struct {
	Tables   []Table
	DataOnly bool
}

func ExportDatabase(db *pgxpool.Pool, w io.Writer, options ExportDatabaseOptions) error {
	if w == nil {
		return fmt.Errorf("writer is nil")
	}

	// Extract connection configuration from the pool
	config := db.Config().ConnConfig
	env := cmdEnvFromConfig(config)

	// Construct pg_dump command arguments
	args := []string{}
	if options.DataOnly {
		args = append(args, "--data-only")
	}
	for _, table := range options.Tables {
		// fullTableName := fmt.Sprintf("%s.%s", table.Schema, table.Name)
		args = append(args, "-t", table.SafeName())
	}
	args = append(args, config.Database)

	// Create and configure the command
	cmd := exec.Command("pg_dump", args...)
	cmd.Env = env.vars
	cmd.Stdout = w // Direct output to the io.Writer

	// Capture stderr for error handling
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	// Run the command
	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("pg_dump failed: %v, stderr: %s", err, stderr.String())
	}

	return nil
}

// ImportDatabase executes an SQL script from an io.Reader against the database using psql.
func ImportDatabase(db *pgxpool.Pool, r io.Reader) error {
	if r == nil {
		return fmt.Errorf("reader is nil")
	}

	// Extract connection configuration from the pool
	config := db.Config().ConnConfig
	env := cmdEnvFromConfig(config)

	// Construct psql command with the database name as an argument
	args := []string{config.Database}

	// Create and configure the command
	cmd := exec.Command("psql", args...)
	cmd.Env = env.vars
	cmd.Stdin = r           // Pipe the SQL script from the io.Reader
	cmd.Stdout = io.Discard // Discard stdout, as we don’t need psql’s output

	// Capture stderr for error handling
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	// Run the command
	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("psql failed: %v, stderr: %s", err, stderr.String())
	}

	return nil
}
