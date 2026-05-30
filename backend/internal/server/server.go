package server

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/ferzferz11-sudo/pansion/internal/config"
	"github.com/ferzferz11-sudo/pansion/internal/handler/auth"
	"github.com/ferzferz11-sudo/pansion/internal/handler/maid"
	"github.com/ferzferz11-sudo/pansion/internal/handler/room"
	"github.com/ferzferz11-sudo/pansion/internal/handler/sos"
	hws "github.com/ferzferz11-sudo/pansion/internal/handler/ws"
	"github.com/ferzferz11-sudo/pansion/internal/middleware"
	"github.com/ferzferz11-sudo/pansion/internal/service"
	pkgws "github.com/ferzferz11-sudo/pansion/internal/ws"
)

// New creates the chi router with all routes, middleware, and WS hub.
func New(cfg *config.Config, jwtSvc *service.JWTService, wsHub *pkgws.Hub, logger *slog.Logger,
	authH *auth.Handler, maidH *maid.Handler, sosH *sos.Handler, roomH *room.Handler) *chi.Mux {

	r := chi.NewRouter()

	// === Global middleware (order matters: recovery → CORS → logging → auth) ===
	r.Use(middleware.Recovery(logger))
	r.Use(middleware.CORS)
	r.Use(middleware.Logging(logger))

	// === Public routes (no auth) ===
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})
	r.Post("/api/v1/auth/login", authH.Login)

	// === Protected routes (JWT required) ===
	r.Group(func(r chi.Router) {
		r.Use(middleware.Authenticate(jwtSvc, logger))

		// Maid endpoints
		r.Get("/api/v1/maid/tasks", maidH.GetTasks)
		r.Post("/api/v1/maid/tasks/complete", maidH.Complete)

		// SOS endpoints
		r.Post("/api/v1/sos", sosH.Create)
		r.Get("/api/v1/sos", sosH.GetActive)

		// Room/chessboard
		r.Get("/api/v1/rooms/chessboard", roomH.GetChessboard)

		// WebSocket upgrade
		wsHandler := hws.NewHandler(wsHub, logger)
		r.Get("/api/v1/ws", wsHandler.Serve)
	})

	return r
}
