package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"strings"

	"github.com/ferzferz11-sudo/pansion/internal/service"
)

// contextKey is a private type to avoid collisions in context.
type contextKey string

const (
	CtxUserID    contextKey = "user_id"
	CtxPensionID contextKey = "pension_id"
	CtxRole      contextKey = "role"
)

// Authenticate validates JWT tokens and injects claims into request context.
// Usage: r.Use(middleware.Authenticate(jwtSvc, logger))
func Authenticate(jwtSvc *service.JWTService, logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			auth := r.Header.Get("Authorization")
			var token string
			if auth != "" && strings.HasPrefix(auth, "Bearer ") {
				token = strings.TrimPrefix(auth, "Bearer ")
			} else {
				// Fallback: token from query param (for WebSocket which can't set headers)
				token = r.URL.Query().Get("token")
			}
			if token == "" {
				http.Error(w, `{"error":"missing or invalid authorization header"}`,
					http.StatusUnauthorized)
				return
			}
			claims, err := jwtSvc.Validate(token)
			if err != nil {
				logger.Warn("jwt validation failed", "error", err)
				http.Error(w, `{"error":"invalid or expired token"}`,
					http.StatusUnauthorized)
				return
			}

			// Inject claims into context for downstream handlers.
			ctx := r.Context()
			ctx = context.WithValue(ctx, CtxUserID, claims.UserID)
			ctx = context.WithValue(ctx, CtxPensionID, claims.PensionID)
			ctx = context.WithValue(ctx, CtxRole, claims.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole is a guard that ensures the user has one of the allowed roles.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, ok := r.Context().Value(CtxRole).(string)
			if !ok {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			for _, allowed := range roles {
				if role == allowed {
					next.ServeHTTP(w, r)
					return
				}
			}
			http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		})
	}
}

// Getters for context values.
func UserID(ctx context.Context) string    { v, _ := ctx.Value(CtxUserID).(string); return v }
func PensionID(ctx context.Context) string { v, _ := ctx.Value(CtxPensionID).(string); return v }
func Role(ctx context.Context) string      { v, _ := ctx.Value(CtxRole).(string); return v }
