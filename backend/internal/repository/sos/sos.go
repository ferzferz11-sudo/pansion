package sos

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ferzferz11-sudo/pansion/internal/domain"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// Create inserts a new SOS signal.
func (r *Repository) Create(ctx context.Context, req domain.CreateSosRequest, pensionID, senderID string) (*domain.SosSignal, error) {
	var roomID *string
	if req.RoomID != nil && *req.RoomID != "" {
		roomID = req.RoomID
	}

	var sig domain.SosSignal
	err := r.db.QueryRow(ctx, `
		INSERT INTO sos_signals (pension_id, room_id, sender_id, message, status)
		VALUES ($1, $2, $3, $4, 'active')
		RETURNING id, pension_id, room_id, sender_id, message, status, created_at
	`, pensionID, roomID, senderID, req.Message).Scan(
		&sig.ID, &sig.PensionID, &sig.RoomID, &sig.SenderID,
		&sig.Message, &sig.Status, &sig.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("create sos: %w", err)
	}
	return &sig, nil
}

// GetActive returns all unresolved SOS signals for a pantheon.
func (r *Repository) GetActive(ctx context.Context, pensionID string) ([]domain.SosSignal, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, pension_id, room_id, sender_id, message, status, created_at
		FROM sos_signals
		WHERE pension_id = $1 AND status = 'active'
		ORDER BY created_at DESC
	`, pensionID)
	if err != nil {
		return nil, fmt.Errorf("query active sos: %w", err)
	}
	defer rows.Close()

	var signals []domain.SosSignal
	for rows.Next() {
		var s domain.SosSignal
		var roomID *string
		if err := rows.Scan(&s.ID, &s.PensionID, &roomID, &s.SenderID,
			&s.Message, &s.Status, &s.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan sos: %w", err)
		}
		s.RoomID = roomID
		signals = append(signals, s)
	}
	return signals, rows.Err()
}
