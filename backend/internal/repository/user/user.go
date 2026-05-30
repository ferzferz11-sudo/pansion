package user

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ferzferz11-sudo/pansion/internal/domain"
)

var ErrUserNotFound = errors.New("user not found")

type Repository struct {
	db     *pgxpool.Pool
	logger *slog.Logger
}

func NewRepository(db *pgxpool.Pool, logger *slog.Logger) *Repository {
	return &Repository{db: db, logger: logger}
}

// GetByEmail finds a user by email (web login).
// Uses COALESCE for nullable columns to avoid pgx NULL scan errors.
func (r *Repository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	var u domain.User
	err := r.db.QueryRow(ctx, `
		SELECT id, pension_id, COALESCE(email, ''), COALESCE(phone, ''), password_hash,
		       first_name, last_name, role, status, created_at, updated_at
		FROM users WHERE email = $1 LIMIT 1
	`, email).Scan(&u.ID, &u.PensionID, &u.Email, &u.Phone,
		&u.PasswordHash, &u.FirstName, &u.LastName,
		&u.Role, &u.Status, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("get by email %s: %w", email, ErrUserNotFound)
		}
		return nil, fmt.Errorf("get by email: %w", err)
	}
	return &u, nil
}

// GetByPhone finds a user by phone (mobile login).
func (r *Repository) GetByPhone(ctx context.Context, phone string) (*domain.User, error) {
	var u domain.User
	err := r.db.QueryRow(ctx, `
		SELECT id, pension_id, COALESCE(email, ''), COALESCE(phone, ''), password_hash,
		       first_name, last_name, role, status, created_at, updated_at
		FROM users WHERE phone = $1 LIMIT 1
	`, phone).Scan(&u.ID, &u.PensionID, &u.Email, &u.Phone,
		&u.PasswordHash, &u.FirstName, &u.LastName,
		&u.Role, &u.Status, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("get by phone %s: %w", phone, ErrUserNotFound)
		}
		return nil, fmt.Errorf("get by phone: %w", err)
	}
	return &u, nil
}

// GetByID finds a user by UUID.
func (r *Repository) GetByID(ctx context.Context, id string) (*domain.User, error) {
	var u domain.User
	err := r.db.QueryRow(ctx, `
		SELECT id, pension_id, COALESCE(email, ''), COALESCE(phone, ''), password_hash,
		       first_name, last_name, role, status, created_at, updated_at
		FROM users WHERE id = $1 LIMIT 1
	`, id).Scan(&u.ID, &u.PensionID, &u.Email, &u.Phone,
		&u.PasswordHash, &u.FirstName, &u.LastName,
		&u.Role, &u.Status, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("get by id %s: %w", id, ErrUserNotFound)
		}
		return nil, fmt.Errorf("get by id: %w", err)
	}
	return &u, nil
}
