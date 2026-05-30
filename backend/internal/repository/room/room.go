package room

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

// GetByPension returns all rooms for "Живая шахматка".
func (r *Repository) GetByPension(ctx context.Context, pensionID string) ([]domain.Room, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, pension_id, number, floor, status, last_cleaned_at, created_at, updated_at
		FROM rooms WHERE pension_id = $1 ORDER BY floor, number
	`, pensionID)
	if err != nil {
		return nil, fmt.Errorf("query rooms: %w", err)
	}
	defer rows.Close()

	var rooms []domain.Room
	for rows.Next() {
		var rm domain.Room
		if err := rows.Scan(&rm.ID, &rm.PensionID, &rm.Number, &rm.Floor,
			&rm.Status, &rm.LastCleanedAt, &rm.CreatedAt, &rm.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan room: %w", err)
		}
		rooms = append(rooms, rm)
	}
	return rooms, rows.Err()
}

// UpdateStatus changes room status and updates last_cleaned_at.
func (r *Repository) UpdateStatus(ctx context.Context, roomID, status string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE rooms SET status = $1, updated_at = NOW()
		WHERE id = $2
	`, status, roomID)
	if err != nil {
		return fmt.Errorf("update room status: %w", err)
	}
	return nil
}
