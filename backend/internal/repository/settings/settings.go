package settings

import (
	"context"
	"fmt"

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

// RoleInfo — роль с количеством пользователей.
type RoleInfo struct {
	Name      string `json:"name"`
	UserCount int    `json:"user_count"`
}

// GetAllRoles returns all roles from the roles table with user counts.
func (r *Repository) GetAllRoles(ctx context.Context, pensionID string) ([]RoleInfo, error) {
	rows, err := r.db.Query(ctx, `
		SELECT r.name, COALESCE(u.cnt, 0) as user_count
		FROM roles r
		LEFT JOIN (
			SELECT role, COUNT(*) as cnt FROM users WHERE pension_id=$1 GROUP BY role
		) u ON r.name = u.role
		ORDER BY r.name
	`, pensionID)
	if err != nil {
		return nil, fmt.Errorf("query roles: %w", err)
	}
	defer rows.Close()

	var roles []RoleInfo
	for rows.Next() {
		var ri RoleInfo
		if err := rows.Scan(&ri.Name, &ri.UserCount); err != nil {
			return nil, fmt.Errorf("scan: %w", err)
		}
		roles = append(roles, ri)
	}
	return roles, rows.Err()
}

// CreateRole creates a new role and default tab settings.
func (r *Repository) CreateRole(ctx context.Context, pensionID, roleName, description string) error {
	if roleName == "" {
		return fmt.Errorf("role name required")
	}
	// Insert into roles table.
	_, err := r.db.Exec(ctx,
		`INSERT INTO roles (name, description) VALUES ($1,$2) ON CONFLICT (name) DO UPDATE SET description=$2`,
		roleName, description)
	if err != nil {
		return fmt.Errorf("insert role: %w", err)
	}

	// Create default tab settings (all visible).
	tabs := []string{"chessboard", "tasks", "guests", "finance", "medical", "sos", "dashboard", "users"}
	for _, tab := range tabs {
		_, err = r.db.Exec(ctx,
			`INSERT INTO role_tabs (pension_id, role, tab_key, visible) VALUES ($1,$2,$3,true) ON CONFLICT DO NOTHING`,
			pensionID, roleName, tab)
		if err != nil {
			return fmt.Errorf("create role tab %s: %w", tab, err)
		}
	}
	return nil
}

// DeleteRole deletes a role, its users, and tab settings.
func (r *Repository) DeleteRole(ctx context.Context, pensionID, roleName string) (int, error) {
	if roleName == "owner" {
		return 0, fmt.Errorf("нельзя удалить роль owner")
	}
	// Delete users with this role.
	tag, err := r.db.Exec(ctx, "DELETE FROM users WHERE pension_id=$1 AND role=$2", pensionID, roleName)
	if err != nil {
		return 0, fmt.Errorf("delete users: %w", err)
	}
	deleted := int(tag.RowsAffected())
	// Delete tab settings.
	_, _ = r.db.Exec(ctx, "DELETE FROM role_tabs WHERE pension_id=$1 AND role=$2", pensionID, roleName)
	// Delete from roles table.
	_, _ = r.db.Exec(ctx, "DELETE FROM roles WHERE name=$1", roleName)
	return deleted, nil
}

// UpdateRole updates role description.
func (r *Repository) UpdateRole(ctx context.Context, roleName, description string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE roles SET description=$2 WHERE name=$1`,
		roleName, description)
	return err
}

// TabSetting represents one row from role_tabs.
type TabSetting struct {
	ID        int64  `json:"id"`
	PensionID string `json:"pension_id"`
	Role      string `json:"role"`
	TabKey    string `json:"tab_key"`
	Visible   bool   `json:"visible"`
}

// GetTabs returns all tab settings for a pension, optionally filtered by role.
func (r *Repository) GetTabs(ctx context.Context, pensionID, role string) ([]TabSetting, error) {
	var rows pgx.Rows
	var err error
	if role != "" {
		rows, err = r.db.Query(ctx,
			"SELECT id, pension_id, role, tab_key, visible FROM role_tabs WHERE pension_id=$1 AND role=$2",
			pensionID, role)
	} else {
		rows, err = r.db.Query(ctx,
			"SELECT id, pension_id, role, tab_key, visible FROM role_tabs WHERE pension_id=$1",
			pensionID)
	}
	if err != nil {
		return nil, fmt.Errorf("query role_tabs: %w", err)
	}
	defer rows.Close()

	var result []TabSetting
	for rows.Next() {
		var t TabSetting
		if err := rows.Scan(&t.ID, &t.PensionID, &t.Role, &t.TabKey, &t.Visible); err != nil {
			return nil, fmt.Errorf("scan: %w", err)
		}
		result = append(result, t)
	}
	return result, rows.Err()
}

// SetTabs updates the visible flag for a tab setting.
func (r *Repository) SetTabs(ctx context.Context, pensionID string, tabKey string, role string, visible bool) error {
	tag, err := r.db.Exec(ctx,
		`UPDATE role_tabs SET visible=$4, updated_at=NOW()
		 WHERE pension_id=$1 AND role=$2 AND tab_key=$3`,
		pensionID, role, tabKey, visible)
	if err != nil {
		return fmt.Errorf("update role_tabs: %w", err)
	}
	if tag.RowsAffected() == 0 {
		_, err = r.db.Exec(ctx,
			`INSERT INTO role_tabs (pension_id, role, tab_key, visible) VALUES ($1,$2,$3,$4)`,
			pensionID, role, tabKey, visible)
		if err != nil {
			return fmt.Errorf("insert role_tabs: %w", err)
		}
	}
	return nil
}

// InitDefaults creates default tab settings for existing pensions (backward compat).
func (r *Repository) InitDefaults(ctx context.Context, pensionID string) error {
	type rt struct{ role, tab string }
	defaults := []rt{
		{"owner", "chessboard"}, {"owner", "tasks"}, {"owner", "guests"}, {"owner", "finance"}, {"owner", "medical"}, {"owner", "sos"}, {"owner", "dashboard"}, {"owner", "users"},
		{"manager", "chessboard"}, {"manager", "tasks"}, {"manager", "guests"}, {"manager", "finance"}, {"manager", "medical"}, {"manager", "sos"}, {"manager", "dashboard"}, {"manager", "users"},
		{"administrator", "chessboard"}, {"administrator", "tasks"}, {"administrator", "guests"}, {"administrator", "medical"}, {"administrator", "dashboard"},
		{"doctor", "chessboard"}, {"doctor", "guests"}, {"doctor", "medical"}, {"doctor", "sos"}, {"doctor", "dashboard"},
		{"maid", "tasks"}, {"maid", "sos"}, {"maid", "dashboard"},
	}
	for _, d := range defaults {
		_, err := r.db.Exec(ctx,
			`INSERT INTO role_tabs (pension_id, role, tab_key, visible) VALUES ($1,$2,$3,true)
			 ON CONFLICT (pension_id, role, tab_key) DO NOTHING`,
			pensionID, d.role, d.tab)
		if err != nil {
			return fmt.Errorf("init default %s/%s: %w", d.role, d.tab, err)
		}
	}
	return nil
}
