package finance

import (
	"encoding/json"
	"net/http"
)

type Handler struct {
	listTransactions func(r *http.Request) ([]map[string]interface{}, error)
}

func NewHandler(fn func(r *http.Request) ([]map[string]interface{}, error)) *Handler {
	return &Handler{listTransactions: fn}
}

// GetTransactions GET /api/v1/finance
func (h *Handler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	txns, err := h.listTransactions(r)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed"})
		return
	}
	if txns == nil {
		txns = []map[string]interface{}{}
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(txns)
}

// GetSummary GET /api/v1/finance/summary
func (h *Handler) GetSummary(w http.ResponseWriter, r *http.Request) {
	summary := map[string]interface{}{
		"income":  0,
		"expense": 0,
		"balance": 0,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(summary)
}
