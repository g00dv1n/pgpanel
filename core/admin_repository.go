package core

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrNoSuchAdmin = errors.New("no such admin")
)

type AdminRepository struct {
	db     *pgxpool.Pool
	logger *slog.Logger
}

func NewAdminRepository(db *pgxpool.Pool, logger *slog.Logger) *AdminRepository {
	return &AdminRepository{
		db:     db,
		logger: logger,
	}
}

type AdminUser struct {
	Username     string
	PasswordHash []byte
}

func (au *AdminUser) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(au.PasswordHash), []byte(password))
	return err == nil
}

func (r *AdminRepository) GetAdmin(username string) (*AdminUser, error) {
	sql := `
		SELECT username, password_hash 
		FROM pgpanel.admins
		WHERE username = $1
	`

	row := r.db.QueryRow(context.Background(), sql, username)

	var au AdminUser

	err := row.Scan(&au.Username, &au.PasswordHash)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNoSuchAdmin
		}
		return nil, fmt.Errorf("error getting admin user: %w", err)
	}

	return &au, err
}

func (r *AdminRepository) GetAdminList() ([]string, error) {
	sql := `
		SELECT username 
		FROM pgpanel.admins
		ORDER BY created_at DESC
	`

	var admins []string

	rows, err := r.db.Query(context.Background(), sql)

	if err != nil {
		return admins, err
	}

	defer rows.Close()

	for rows.Next() {
		var username string

		if err := rows.Scan(&username); err != nil {
			return admins, err
		}

		admins = append(admins, username)
	}

	return admins, nil
}

func (r *AdminRepository) AddAdmin(username string, password string) error {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	if err != nil {
		return fmt.Errorf("error adding admin user: %w", err)
	}

	sql := `
    INSERT INTO pgpanel.admins (username, password_hash)
    VALUES ($1, $2)
  `

	_, err = r.db.Exec(context.Background(), sql, username, passwordHash)

	if err != nil {
		return fmt.Errorf("error adding admin user: %w", err)
	}

	return nil
}

func (r *AdminRepository) DeleteAdmin(username string) error {
	sql := `
    DELETE FROM pgpanel.admins
    WHERE username = $1
  `

	_, err := r.db.Exec(context.Background(), sql, username)

	if err != nil {
		return fmt.Errorf("error deleting admin user: %w", err)
	}

	return nil
}
