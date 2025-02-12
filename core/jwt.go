package core

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// CustomClaims extends standard JWT claims
type AdminClaims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// GenerateJwtToken creates a new JWT token
func GenerateJwtToken(username string, secretKey []byte, ttl time.Duration) (string, error) {
	// Set token expiration
	expirationTime := time.Now().Add(ttl)

	// Create claims
	claims := AdminClaims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "pgPanel",
		},
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign and get the complete encoded token as a string
	return token.SignedString(secretKey)
}

// ValidateJwtToken checks if the token is valid
func ValidateJwtToken(tokenString string, secretKey []byte) (*AdminClaims, error) {
	var claims AdminClaims
	token, err := jwt.ParseWithClaims(tokenString, &claims, func(t *jwt.Token) (interface{}, error) {
		// Validate the signing method (optional but recommended)
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}

		return secretKey, nil
	})

	if err != nil {
		// override ErrTokenExpired to show pretty error on frontend
		switch {
		case errors.Is(err, jwt.ErrTokenExpired):
			return nil, fmt.Errorf("token is expired")
		default:
			return nil, err
		}
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return &claims, nil
}

func ExtractBearerToken(r *http.Request) (string, error) {
	// Get the Authorization header
	authHeader := r.Header.Get("Authorization")

	// Check if header is empty
	if authHeader == "" {
		return "", fmt.Errorf("authorization header is missing")
	}

	// Split the header
	parts := strings.SplitN(authHeader, " ", 2)

	// Validate header format
	if len(parts) < 1 || strings.ToLower(parts[0]) != "bearer" {
		return "", fmt.Errorf("invalid authorization header format")
	}

	if len(parts) < 2 {
		return "", fmt.Errorf("empty authorization token")
	}

	return parts[1], nil
}

func GenerateSecureSecret(byteLength int) (string, error) {
	// Enforce minimum length for security
	if byteLength < 32 {
		return "", fmt.Errorf("crypto/rand: insufficient length - minimum 32 bytes required")
	}

	// Generate random bytes
	bytes := make([]byte, byteLength)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}

	// Convert to URL-safe base64 without padding
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}
