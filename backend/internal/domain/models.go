package domain

import "time"

// User represents a staff member of the pantheon network.
type User struct {
	ID           string    `json:"id"`
	PensionID    string    `json:"pension_id"`
	Email        string    `json:"email,omitempty"`
	Phone        string    `json:"phone,omitempty"`
	PasswordHash string    `json:"-"`
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	Role         string    `json:"role"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Room represents a single accommodation unit.
type Room struct {
	ID            string     `json:"id"`
	PensionID     string     `json:"pension_id"`
	Number        string     `json:"number"`
	Floor         int        `json:"floor"`
	Status        string     `json:"status"`
	LastCleanedAt *time.Time `json:"last_cleaned_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// MaidTask represents a cleaning task assigned to a maid.
type MaidTask struct {
	ID          string     `json:"id"`
	RoomID      string     `json:"room_id"`
	RoomNumber  string     `json:"room_number,omitempty"`
	MaidID      *string    `json:"maid_id,omitempty"`
	TaskType    string     `json:"task_type"`
	Status      string     `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
}

// SosSignal represents an emergency SOS alarm.
type SosSignal struct {
	ID         int64      `json:"id"`
	PensionID  string     `json:"pension_id"`
	RoomID     *string    `json:"room_id,omitempty"`
	SenderID   string     `json:"sender_id"`
	Message    string     `json:"message"`
	Status     string     `json:"status"`
	CreatedAt  time.Time  `json:"created_at"`
	ResolvedAt *time.Time `json:"resolved_at,omitempty"`
}

// LoginRequest / LoginResponse
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// CreateSosRequest
type CreateSosRequest struct {
	RoomID  *string `json:"room_id,omitempty"`
	Message string  `json:"message"`
}

// CompletedTaskRequest maid marks task done
type CompletedTaskRequest struct {
	TaskID string `json:"task_id"`
}
