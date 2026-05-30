package sos

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/ferzferz11-sudo/pansion/internal/domain"
)

type Usecase struct {
	sosRepo domain.SosRepository
	broadcaster Broadcaster // WebSocket hub reference
	logger  *slog.Logger
}

// Bridge interface: sos usecase broadcasts via WS without importing ws package.
type Broadcaster interface {
	BroadcastSos(signal domain.SosSignal)
}

func NewUsecase(sosRepo domain.SosRepository, broadcaster Broadcaster, logger *slog.Logger) *Usecase {
	return &Usecase{sosRepo: sosRepo, broadcaster: broadcaster, logger: logger}
}

// Create creates an SOS signal and broadcasts via WebSocket.
func (u *Usecase) Create(ctx context.Context, req domain.CreateSosRequest, pensionID, senderID string) (*domain.SosSignal, error) {
	sig, err := u.sosRepo.Create(ctx, req, pensionID, senderID)
	if err != nil {
		u.logger.Error("create sos failed", "error", err)
		return nil, fmt.Errorf("create sos: %w", err)
	}

	// Immediately broadcast to all connected managers/doctors/maids.
	if u.broadcaster != nil {
		u.broadcaster.BroadcastSos(*sig)
	}

	u.logger.Warn("SOS signal created", "id", sig.ID, "room_id", req.RoomID)
	return sig, nil
}

// GetActive returns unresolved SOS signals.
func (u *Usecase) GetActive(ctx context.Context, pensionID string) ([]domain.SosSignal, error) {
	return u.sosRepo.GetActive(ctx, pensionID)
}
