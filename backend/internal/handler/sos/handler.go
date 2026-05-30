package sos

import (
	"encoding/json"
	"net/http"

	"github.com/ferzferz11-sudo/pansion/internal/domain"
	"github.com/ferzferz11-sudo/pansion/internal/middleware"
	"github.com/ferzferz11-sudo/pansion/internal/usecase"
)

type Handler struct {
	uc usecase.SosUsecase
}

func NewHandler(uc usecase.SosUsecase) *Handler {
	return &Handler{uc: uc}
}

// Create POST /api/v1/sos
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateSosRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Message == "" {
		respondError(w, http.StatusBadRequest, "invalid request")
		return
	}
	pensionID := middleware.PensionID(r.Context())
	senderID := middleware.UserID(r.Context())
	sig, err := h.uc.Create(r.Context(), req, pensionID, senderID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create SOS")
		return
	}
	respondJSON(w, http.StatusCreated, sig)
}

// GetActive GET /api/v1/sos
func (h *Handler) GetActive(w http.ResponseWriter, r *http.Request) {
	pensionID := middleware.PensionID(r.Context())
	signals, err := h.uc.GetActive(r.Context(), pensionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to get SOS")
		return
	}
	respondJSON(w, http.StatusOK, signals)
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, msg string) {
	respondJSON(w, status, map[string]string{"error": msg})
}
