package settings

import (
	"encoding/json"
	"net/http"

	"github.com/ferzferz11-sudo/pansion/internal/middleware"
)

type Handler struct {
	getTabs func(r *http.Request, role string) ([]map[string]interface{}, error)
	setTabs func(r *http.Request) error
}

func NewHandler(get func(r *http.Request, role string) ([]map[string]interface{}, error),
	set func(r *http.Request) error) *Handler {
	return &Handler{get, set}
}

func (h *Handler) GetTabs(w http.ResponseWriter, r *http.Request) {
	role := r.URL.Query().Get("role")
	tabs, err := h.getTabs(r, role)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "Ошибка загрузки настроек"})
		return
	}
	writeJSON(w, 200, tabs)
}

func (h *Handler) SetTab(w http.ResponseWriter, r *http.Request) {
	if err := h.setTabs(r); err != nil {
		writeJSON(w, 400, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

var _ = middleware.PensionID
