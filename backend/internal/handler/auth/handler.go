package auth

import (
	"encoding/json"
	"net/http"

	"github.com/ferzferz11-sudo/pansion/internal/domain"
	"github.com/ferzferz11-sudo/pansion/internal/usecase"
)

type Handler struct {
	uc usecase.AuthUsecase
}

func NewHandler(uc usecase.AuthUsecase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req domain.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	resp, err := h.uc.Login(r.Context(), req)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
