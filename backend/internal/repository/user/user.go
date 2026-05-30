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


// ListAll returns all staff members of a panthnon.
func (r *Repository) ListAll(ctx context.Context, pensionID string) ([]domain.User, error) {
	rows, err := r.db.Query(ctx, `SELECT id, pension_id, COALESCE(email,''), COALESCE(phone,''), password_hash, first_name, last_name, role, status, created_at, updated_at FROM users WHERE pension_id=$1 ORDER BY created_at DESC`, pensionID)
	if err != nil { return nil, fmt.Errorf("query users: %w", err) }
	defer rows.Close()
	var users []domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID,&u.PensionID,&u.Email,&u.Phone,&u.PasswordHash,&u.FirstName,&u.LastName,&u.Role,&u.Status,&u.CreatedAt,&u.UpdatedAt); err != nil { return nil, fmt.Errorf("scan: %w", err) }
		users = append(users, u)
	}
	return users, rows.Err()
}

func (r *Repository) Create(ctx context.Context, u *domain.User) error {
	return r.db.QueryRow(ctx, `INSERT INTO users (pension_id,email,phone,password_hash,first_name,last_name,role,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,created_at,updated_at`, u.PensionID,u.Email,u.Phone,u.PasswordHash,u.FirstName,u.LastName,u.Role,u.Status).Scan(&u.ID,&u.CreatedAt,&u.UpdatedAt)
}

func (r *Repository) Update(ctx context.Context, u *domain.User) error {
	tag, err := r.db.Exec(ctx, `UPDATE users SET email=$2,phone=$3,first_name=$4,last_name=$5,role=$6,status=$7,updated_at=NOW() WHERE id=$1`, u.ID,u.Email,u.Phone,u.FirstName,u.LastName,u.Role,u.Status)
	if err != nil { return fmt.Errorf("update: %w", err) }
	if tag.RowsAffected() == 0 { return fmt.Errorf("not found") }
	return nil
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	tag, err := r.db.Exec(ctx, "DELETE FROM users WHERE id=$1", id)
	if err != nil { return fmt.Errorf("delete: %w", err) }
	if tag.RowsAffected() == 0 { return fmt.Errorf("not found") }
	return nil
}
