package ws

import (
	"log/slog"
	"net/http"

	"github.com/ferzferz11-sudo/pansion/internal/middleware"
	pkgws "github.com/ferzferz11-sudo/pansion/internal/ws"
)

type Handler struct {
	hub    *pkgws.Hub
	logger *slog.Logger
}

func NewHandler(hub *pkgws.Hub, logger *slog.Logger) *Handler {
	return &Handler{hub: hub, logger: logger}
}

// Serve GET /api/v1/ws
func (h *Handler) Serve(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r.Context())
	role := middleware.Role(r.Context())
	pensionID := middleware.PensionID(r.Context())
	h.hub.ServeWS(w, r, userID, role, pensionID)
}
