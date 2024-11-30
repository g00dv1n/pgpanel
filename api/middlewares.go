package api

import (
	"context"
	"net/http"

	"github.com/g00dv1n/pgpanel/core"
)

func AuthMiddleware(next ApiHandler) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		token, err := core.ExtractBearerToken(r)

		if err != nil {
			return NewApiError(http.StatusForbidden, err)
		}

		claims, err := core.ValidateJwtToken(token)

		if err != nil {
			return NewApiError(http.StatusForbidden, err)
		}

		return next(w, r.WithContext(context.WithValue(r.Context(), core.AdminContextKey, claims.Username)))
	}
}
