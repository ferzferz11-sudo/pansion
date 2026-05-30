package guest

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ensure pgx is used (pgxpool.Pool.Query returns *pgx.Rows).
var _ pgx.TxOptions

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// List returns all guests with their room number (if assigned).
func (r *Repository) List(ctx context.Context, pensionID string) ([]GuestRow, error) {
	rows, err := r.db.Query(ctx, `
		SELECT g.id, g.first_name, g.last_name, g.middle_name,
		       g.birth_date, g.diet_type, g.character_notes, g.status,
		       g.created_at, r.number as room_number
		FROM guests g
		LEFT JOIN rooms r ON r.id = g.room_id
		WHERE g.room_id IS NULL OR r.pension_id = $1
		ORDER BY g.created_at DESC
	`, pensionID)
	if err != nil {
		return nil, fmt.Errorf("query guests: %w", err)
	}
	defer rows.Close()

	var guests []GuestRow
	for rows.Next() {
		var g GuestRow
		var roomNumber *string
		var bd *time.Time
		if err := rows.Scan(&g.ID, &g.FirstName, &g.LastName, &g.MiddleName,
			&bd, &g.DietType, &g.CharacterNotes, &g.Status,
			&g.CreatedAt, &roomNumber); err != nil {
			return nil, fmt.Errorf("scan guest: %w", err)
		}
		g.RoomNumber = roomNumber
		g.BirthDate = bd
		guests = append(guests, g)
	}
	return guests, rows.Err()
}

type GuestRow struct {
	ID             string     `json:"id"`
	FirstName      string     `json:"first_name"`
	LastName       string     `json:"last_name"`
	MiddleName     string     `json:"middle_name,omitempty"`
	BirthDate      *time.Time `json:"birth_date,omitempty"`
	DietType       string     `json:"diet_type"`
	CharacterNotes string     `json:"character_notes"`
	Status         string     `json:"status"`
	RoomNumber     *string    `json:"room_number,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}
