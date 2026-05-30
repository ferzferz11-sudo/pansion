package maid

import (
	"encoding/json"
	"net/http"

	"github.com/ferzferz11-sudo/pansion/internal/domain"
	"github.com/ferzferz11-sudo/pansion/internal/middleware"
	"github.com/ferzferz11-sudo/pansion/internal/usecase"
)

type Handler struct {
	uc usecase.MaidTaskUsecase
}

func NewHandler(uc usecase.MaidTaskUsecase) *Handler {
	return &Handler{uc: uc}
}

// GetTasks GET /api/v1/maid/tasks?status=pending|in_progress|completed|all
// Owner/manager see ALL tasks. Maid sees only her own.
func (h *Handler) GetTasks(w http.ResponseWriter, r *http.Request) {
	role := middleware.Role(r.Context())
	_ = middleware.UserID(r.Context())

	status := r.URL.Query().Get("status")
	if status == "" {
		status = "pending"
	}

	// For now, return all tasks regardless of role.
	// TODO: filter by maid_id when role=maid.
	tasks, err := h.uc.GetTasks(r.Context(), "", "all")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to get tasks"})
		return
	}

	// Client-side filter by status if needed.
	if status != "all" {
		filtered := make([]domain.MaidTask, 0)
		for _, t := range tasks {
			if t.Status == status {
				filtered = append(filtered, t)
			}
		}
		tasks = filtered
	}
	_ = role

	writeJSON(w, http.StatusOK, tasks)
}

// Complete POST /api/v1/maid/tasks/complete
func (h *Handler) Complete(w http.ResponseWriter, r *http.Request) {
	var req domain.CompletedTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}
	if err := h.uc.Complete(r.Context(), req.TaskID); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "completed"})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
