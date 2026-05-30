package usecase

import (
	"context"

	"github.com/ferzferz11-sudo/pansion/internal/domain"
)

// AuthUsecase defines authentication business logic.
type AuthUsecase interface {
	Login(ctx context.Context, req domain.LoginRequest) (domain.LoginResponse, error)
}

// MaidTaskUsecase defines maid task business logic.
type MaidTaskUsecase interface {
	GetTasks(ctx context.Context, maidID, status string) ([]domain.MaidTask, error)
	Complete(ctx context.Context, taskID string) error
}

// SosUsecase defines SOS signal business logic.
type SosUsecase interface {
	Create(ctx context.Context, req domain.CreateSosRequest, pensionID, senderID string) (*domain.SosSignal, error)
	GetActive(ctx context.Context, pensionID string) ([]domain.SosSignal, error)
}

// RoomUsecase defines room/chessboard business logic.
type RoomUsecase interface {
	GetChessboard(ctx context.Context, pensionID string) ([]domain.Room, error)
	UpdateStatus(ctx context.Context, roomID, status string) error
}
