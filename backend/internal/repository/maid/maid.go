package maid

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ferzferz11-sudo/pansion/internal/domain"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// GetTasksByMaid returns tasks filtered by maid_id and status.
// statusFilter "all" returns all statuses.
func (r *Repository) GetTasksByMaid(ctx context.Context, maidID, statusFilter string) ([]domain.MaidTask, error) {
	var rows pgx.Rows
	var err error

	if statusFilter == "all" {
		rows, err = r.db.Query(ctx, `
			SELECT t.id, t.room_id, r.number, t.maid_id, t.task_type, t.status,
			       t.created_at, t.completed_at
			FROM maid_tasks t
			JOIN rooms r ON r.id = t.room_id
			WHERE t.maid_id = $1
			ORDER BY t.created_at DESC
		`, maidID)
	} else {
		rows, err = r.db.Query(ctx, `
			SELECT t.id, t.room_id, r.number, t.maid_id, t.task_type, t.status,
			       t.created_at, t.completed_at
			FROM maid_tasks t
			JOIN rooms r ON r.id = t.room_id
			WHERE t.maid_id = $1 AND t.status = $2
			ORDER BY t.created_at DESC
		`, maidID, statusFilter)
	}
	if err != nil {
		return nil, fmt.Errorf("query maid tasks: %w", err)
	}
	defer rows.Close()

	var tasks []domain.MaidTask
	for rows.Next() {
		var t domain.MaidTask
		var maidID *string
		var completedAt *time.Time
		if err := rows.Scan(&t.ID, &t.RoomID, &t.RoomNumber, &maidID,
			&t.TaskType, &t.Status, &t.CreatedAt, &completedAt); err != nil {
			return nil, fmt.Errorf("scan maid task: %w", err)
		}
		t.MaidID = maidID
		t.CompletedAt = completedAt
		tasks = append(tasks, t)
	}
	return tasks, rows.Err()
}

// CompleteTask marks a task as completed.
func (r *Repository) CompleteTask(ctx context.Context, taskID string) error {
	tag, err := r.db.Exec(ctx, `
		UPDATE maid_tasks
		SET status = 'completed', completed_at = NOW()
		WHERE id = $1 AND status != 'completed'
	`, taskID)
	if err != nil {
		return fmt.Errorf("complete task %s: %w", taskID, err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("task %s already completed or not found", taskID)
	}
	return nil
}
