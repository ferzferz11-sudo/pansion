package finance

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var _ pgx.TxOptions

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(ctx context.Context, pensionID string) ([]TxnRow, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, type, amount, category, description, created_at
		FROM transactions
		WHERE pension_id = $1
		ORDER BY created_at DESC
		LIMIT 100
	`, pensionID)
	if err != nil {
		return nil, fmt.Errorf("query transactions: %w", err)
	}
	defer rows.Close()

	var txns []TxnRow
	for rows.Next() {
		var t TxnRow
		var createdAt time.Time
		if err := rows.Scan(&t.ID, &t.Type, &t.Amount, &t.Category, &t.Description, &createdAt); err != nil {
			return nil, fmt.Errorf("scan txn: %w", err)
		}
		t.CreatedAt = createdAt.Format("2006-01-02 15:04")
		txns = append(txns, t)
	}
	return txns, rows.Err()
}

func (r *Repository) Summary(ctx context.Context, pensionID string) (income, expense float64, err error) {
	var inc, exp float64
	err = r.db.QueryRow(ctx, `
		SELECT
			COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)
		FROM transactions WHERE pension_id = $1
	`, pensionID).Scan(&inc, &exp)
	return inc, exp, err
}

type TxnRow struct {
	ID          string  `json:"id"`
	Type        string  `json:"type"`
	Amount      float64 `json:"amount"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
	CreatedAt   string  `json:"created_at"`
}
