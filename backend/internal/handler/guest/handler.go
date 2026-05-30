package guest

import (
	"encoding/json"
	"net/http"
)

type Handler struct {
	listGuests func(r *http.Request) ([]map[string]interface{}, error)
}

func NewHandler(listFn func(r *http.Request) ([]map[string]interface{}, error)) *Handler {
	return &Handler{listGuests: listFn}
}

// GetGuests GET /api/v1/guests
func (h *Handler) GetGuests(w http.ResponseWriter, r *http.Request) {
	guests, err := h.listGuests(r)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed"})
		return
	}
	if guests == nil {
		guests = []map[string]interface{}{}
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(guests)
}
