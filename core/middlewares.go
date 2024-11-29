package core

import (
	"context"
	"net/http"
)

type ApiMiddleware func(next ApiHandler) ApiHandler

func ChainMiddlewares(handler ApiHandler, middlewares ...ApiMiddleware) ApiHandler {
	for i := len(middlewares) - 1; i >= 0; i-- {
		handler = middlewares[i](handler)
	}
	return handler
}

func AuthMiddleware(next ApiHandler) ApiHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		token, err := ExtractBearerToken(r)

		if err != nil {
			return NewApiError(http.StatusForbidden, err)
		}

		claims, err := ValidateToken(token)

		if err != nil {
			return NewApiError(http.StatusForbidden, err)
		}

		return next(w, r.WithContext(context.WithValue(r.Context(), AdminContextKey, claims.Username)))
	}
}
