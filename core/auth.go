package core

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Define context keys
const (
	AdminContextKey = "admin"
)

// Secret key for signing and verifying tokens
// @TODO SECURE KEY SETTING
var secretKey = []byte("your-secret-key")

// CustomClaims extends standard JWT claims
type AdminClaims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// GenerateToken creates a new JWT token
func GenerateToken(username string, ttl time.Duration) (string, error) {
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

// ValidateToken checks if the token is valid
func ValidateToken(tokenString string) (*AdminClaims, error) {
	// Parse the token
	token, err := jwt.ParseWithClaims(tokenString, &AdminClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return secretKey, nil
	})

	// Check for parsing errors
	if err != nil {
		return nil, err
	}

	// Extract and return claims if token is valid
	if claims, ok := token.Claims.(*AdminClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

func ExtractBearerToken(r *http.Request) (string, error) {
	// Get the Authorization header
	authHeader := r.Header.Get("Authorization")

	// Check if header is empty
	if authHeader == "" {
		return "", fmt.Errorf("authorization header is missing")
	}

	// Split the header
	parts := strings.Split(authHeader, " ")

	// Validate header format
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return "", fmt.Errorf("invalid authorization header format")
	}

	return parts[1], nil
}
