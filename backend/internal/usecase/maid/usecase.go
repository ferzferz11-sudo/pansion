package maid

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/ferzferz11-sudo/pansion/internal/domain"
)

type Usecase struct {
	taskRepo domain.MaidTaskRepository
	logger   *slog.Logger
}

func NewUsecase(taskRepo domain.MaidTaskRepository, logger *slog.Logger) *Usecase {
	return &Usecase{taskRepo: taskRepo, logger: logger}
}

// GetTasks returns task list filtered by status.
func (u *Usecase) GetTasks(ctx context.Context, maidID, status string) ([]domain.MaidTask, error) {
	tasks, err := u.taskRepo.GetTasksByMaid(ctx, maidID, status)
	if err != nil {
		u.logger.Error("get maid tasks failed", "error", err, "maid_id", maidID)
		return nil, fmt.Errorf("get tasks: %w", err)
	}
	return tasks, nil
}

// Complete marks a maid task as done.
func (u *Usecase) Complete(ctx context.Context, taskID string) error {
	if err := u.taskRepo.CompleteTask(ctx, taskID); err != nil {
		u.logger.Error("complete task failed", "error", err, "task_id", taskID)
		return fmt.Errorf("complete task: %w", err)
	}
	u.logger.Info("task completed", "task_id", taskID)
	return nil
}
