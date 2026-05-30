package room

import (
	"encoding/json"
	"net/http"

	"github.com/ferzferz11-sudo/pansion/internal/middleware"
	"github.com/ferzferz11-sudo/pansion/internal/usecase"
)

type Handler struct {
	uc usecase.RoomUsecase
}

func NewHandler(uc usecase.RoomUsecase) *Handler {
	return &Handler{uc: uc}
}

// GetChessboard GET /api/v1/rooms/chessboard
func (h *Handler) GetChessboard(w http.ResponseWriter, r *http.Request) {
	pensionID := middleware.PensionID(r.Context())
	rooms, err := h.uc.GetChessboard(r.Context(), pensionID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed to get rooms"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(rooms)
}
