package room

import (
	"context"
	"fmt"

	"github.com/ferzferz11-sudo/pansion/internal/domain"
)

type Usecase struct {
	roomRepo domain.RoomRepository
}

func NewUsecase(roomRepo domain.RoomRepository) *Usecase {
	return &Usecase{roomRepo: roomRepo}
}

// GetChessboard returns all rooms for a pantheon (the "Живая шахматка" screen).
func (u *Usecase) GetChessboard(ctx context.Context, pensionID string) ([]domain.Room, error) {
	rooms, err := u.roomRepo.GetByPension(ctx, pensionID)
	if err != nil {
		return nil, fmt.Errorf("get chessboard: %w", err)
	}
	return rooms, nil
}

// UpdateStatus changes room status.
func (u *Usecase) UpdateStatus(ctx context.Context, roomID, status string) error {
	if err := u.roomRepo.UpdateStatus(ctx, roomID, status); err != nil {
		return fmt.Errorf("update status: %w", err)
	}
	return nil
}
