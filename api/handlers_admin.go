package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/g00dv1n/pgpanel/core"
)

// ---------------------- Admin API Handleers -------------------------------
type LoginCreds struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

func adminLoginHandler() ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		var creds LoginCreds
		err := json.NewDecoder(r.Body).Decode(&creds)

		if err != nil {
			return NewApiError(http.StatusBadRequest, err)
		}

		if creds.Username != "admin" {
			return NewApiError(http.StatusUnauthorized, errors.New("can't find this admin user"))
		}

		if creds.Password != "admin" {
			return NewApiError(http.StatusUnauthorized, errors.New("invalid password"))
		}

		token, err := core.GenerateToken(creds.Username, 24*time.Hour)

		if err != nil {
			return NewApiError(http.StatusUnauthorized, err)
		}

		res := LoginResponse{
			Token: token,
		}

		return WriteJson(w, &res)
	}
}
