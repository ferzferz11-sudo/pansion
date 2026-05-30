package domain

import "context"

type UserRepository interface {
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByPhone(ctx context.Context, phone string) (*User, error)
	GetByID(ctx context.Context, id string) (*User, error)
	ListAll(ctx context.Context, pensionID string) ([]User, error)
	Create(ctx context.Context, u *User) error
	Update(ctx context.Context, u *User) error
	Delete(ctx context.Context, id string) error
}

type MaidTaskRepository interface {
	GetTasksByMaid(ctx context.Context, maidID, statusFilter string) ([]MaidTask, error)
	CompleteTask(ctx context.Context, taskID string) error
}

type SosRepository interface {
	Create(ctx context.Context, req CreateSosRequest, pensionID, senderID string) (*SosSignal, error)
	GetActive(ctx context.Context, pensionID string) ([]SosSignal, error)
}

type RoomRepository interface {
	GetByPension(ctx context.Context, pensionID string) ([]Room, error)
	UpdateStatus(ctx context.Context, roomID, status string) error
}
