package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	app2 "github.com/ferzferz11-sudo/pansion/internal/app"
	"github.com/ferzferz11-sudo/pansion/internal/config"
	"github.com/ferzferz11-sudo/pansion/internal/db"

	handlerAuth "github.com/ferzferz11-sudo/pansion/internal/handler/auth"
	handlerMaid "github.com/ferzferz11-sudo/pansion/internal/handler/maid"
	handlerRoom "github.com/ferzferz11-sudo/pansion/internal/handler/room"
	handlerSos "github.com/ferzferz11-sudo/pansion/internal/handler/sos"
	repoMaid "github.com/ferzferz11-sudo/pansion/internal/repository/maid"
	repoRoom "github.com/ferzferz11-sudo/pansion/internal/repository/room"
	repoSos "github.com/ferzferz11-sudo/pansion/internal/repository/sos"
	repoUser "github.com/ferzferz11-sudo/pansion/internal/repository/user"
	"github.com/ferzferz11-sudo/pansion/internal/server"
	"github.com/ferzferz11-sudo/pansion/internal/service"
	usecaseAuth "github.com/ferzferz11-sudo/pansion/internal/usecase/auth"
	usecaseMaid "github.com/ferzferz11-sudo/pansion/internal/usecase/maid"
	usecaseRoom "github.com/ferzferz11-sudo/pansion/internal/usecase/room"
	usecaseSos "github.com/ferzferz11-sudo/pansion/internal/usecase/sos"
	pkgWs "github.com/ferzferz11-sudo/pansion/internal/ws"
)

func main() {
	// === Logger (structured slog) ===
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// === Config ===
	cfg := config.Load()
	logger.Info("config loaded", "port", cfg.ServerPort)

	// === Database pool ===
	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg.DatabaseURL, logger)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	// === JWT service ===
	jwtSvc := service.NewJWTService(cfg.JWTSecret, 24*time.Hour)

	// === WebSocket hub ===
	wsHub := pkgWs.NewHub(logger)
	go wsHub.Run()

	// === Repositories ===
	userRepo := repoUser.NewRepository(pool, logger)
	maidRepo := repoMaid.NewRepository(pool)
	sosRepo := repoSos.NewRepository(pool)
	roomRepo := repoRoom.NewRepository(pool)

	// === Usecases ===
	authUC := usecaseAuth.NewUsecase(userRepo, jwtSvc, logger)
	maidUC := usecaseMaid.NewUsecase(maidRepo, logger)
	sosUC := usecaseSos.NewUsecase(sosRepo, wsHub, logger)
	roomUC := usecaseRoom.NewUsecase(roomRepo)

	// === Handlers ===
	authH := handlerAuth.NewHandler(authUC)
	maidH := handlerMaid.NewHandler(maidUC)
	sosH := handlerSos.NewHandler(sosUC)
	roomH := handlerRoom.NewHandler(roomUC)

	// === Router ===
	r := server.New(cfg, jwtSvc, wsHub, logger, authH, maidH, sosH, roomH)

	// === Seed admin ===
	seedAdmin(context.Background(), pool, logger)

	// === HTTP server with graceful shutdown ===
	srv := &http.Server{
		Addr:         cfg.ServerPort,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	app2.Run(srv, logger, func() {
		logger.Info("closing database pool...")
		pool.Close()
	})
}

// seedAdmin creates admin/admin123 if users table is empty.
func seedAdmin(ctx context.Context, pool *pgxpool.Pool, logger *slog.Logger) {
	defer func() {
		if r := recover(); r != nil {
			logger.Warn("seed panic", "error", r)
		}
	}()

	var exists bool
	err := pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users LIMIT 1)").Scan(&exists)
	if err != nil || exists {
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("seed: hash failed", "error", err)
		return
	}

	// Insert a default pantheon first.
	var pensionID string
	err = pool.QueryRow(ctx, `
		INSERT INTO pensions (name, address) VALUES ('Родные Пенаты', 'Москва')
		ON CONFLICT DO NOTHING RETURNING id
	`).Scan(&pensionID)
	if err != nil {
		// Try to get existing
		_ = pool.QueryRow(ctx, "SELECT id FROM pensions LIMIT 1").Scan(&pensionID)
	}
	if pensionID == "" {
		logger.Warn("seed: no pension available")
		return
	}

	_, err = pool.Exec(ctx, `
		INSERT INTO users (pension_id, email, password_hash, first_name, last_name, role, status)
		VALUES ($1, 'admin@pansion.local', $2, 'Admin', 'System', 'owner', 'active')
	`, pensionID, string(hash))
	if err != nil {
		logger.Warn("seed: insert admin failed", "error", err)
	} else {
		logger.Info("seed: admin created — admin@pansion.local / admin123")
	}
}
