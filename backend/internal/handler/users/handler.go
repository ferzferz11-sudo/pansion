package users

import (
	"encoding/json"
	"net/http"

	"github.com/ferzferz11-sudo/pansion/internal/domain"
	"github.com/ferzferz11-sudo/pansion/internal/middleware"
)

type Handler struct {
	listUsers   func(r *http.Request) ([]domain.User, error)
	createUser  func(r *http.Request) (*domain.User, error)
	updateUser  func(r *http.Request) error
	deleteUser  func(r *http.Request) error
}

func NewHandler(list func(r *http.Request) ([]domain.User, error),
	create func(r *http.Request) (*domain.User, error),
	update func(r *http.Request) error,
	del func(r *http.Request) error) *Handler {
	return &Handler{list, create, update, del}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	users, err := h.listUsers(r)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "Ошибка загрузки"})
		return
	}
	writeJSON(w, 200, users)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	u, err := h.createUser(r)
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 201, u)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	if err := h.updateUser(r); err != nil {
		writeJSON(w, 400, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	if err := h.deleteUser(r); err != nil {
		writeJSON(w, 400, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "deleted"})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// Ensure middleware is used.
var _ = middleware.Role
