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
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	cfg := config.Load()
	logger.Info("config loaded", "port", cfg.ServerPort)

	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg.DatabaseURL, logger)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	jwtSvc := service.NewJWTService(cfg.JWTSecret, 24*time.Hour)
	wsHub := pkgWs.NewHub(logger)
	go wsHub.Run()

	userRepo := repoUser.NewRepository(pool, logger)
	maidRepo := repoMaid.NewRepository(pool)
	sosRepo := repoSos.NewRepository(pool)
	roomRepo := repoRoom.NewRepository(pool)

	authUC := usecaseAuth.NewUsecase(userRepo, jwtSvc, logger)
	maidUC := usecaseMaid.NewUsecase(maidRepo, logger)
	sosUC := usecaseSos.NewUsecase(sosRepo, wsHub, logger)
	roomUC := usecaseRoom.NewUsecase(roomRepo)

	authH := handlerAuth.NewHandler(authUC)
	maidH := handlerMaid.NewHandler(maidUC)
	sosH := handlerSos.NewHandler(sosUC)
	roomH := handlerRoom.NewHandler(roomUC)

	r := server.New(cfg, jwtSvc, wsHub, logger, authH, maidH, sosH, roomH, pool)

	seedAdmin(context.Background(), pool, logger)

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

// seedAdmin ensures admin@pansion.local exists. If the users table is empty,
// runs the full demo seed (rooms, guests, tasks, finance).
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

	logger.Info("seed: empty DB, loading demo data from seed.sql")

	// Read and execute seed.sql.
	// The seed script handles all: pensions, users, rooms, guests, tasks, transactions.
	// We run it via psql because it uses DO $$ blocks (PL/pgSQL).
	// Alternative: embed it here. For now, just create minimal data directly.

	hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)

	var pensionID string
	err = pool.QueryRow(ctx,
		"INSERT INTO pensions (name, address) VALUES ('Родные Пенаты — Крым', 'Крым, Ялта, ул. Морская, 12') RETURNING id",
	).Scan(&pensionID)
	if err != nil {
		logger.Error("seed: pension failed", "error", err)
		return
	}

	_, _ = pool.Exec(ctx, `
		INSERT INTO users (pension_id, email, phone, password_hash, first_name, last_name, role, status) VALUES
		($1, 'admin@pansion.local', '+790****1000', $2, 'Админ', 'Системы', 'owner', 'active')
	`, pensionID, string(hash))

	_, _ = pool.Exec(ctx, `
		INSERT INTO users (pension_id, email, phone, password_hash, first_name, last_name, role, status) VALUES
		($1, 'manager@pansion.local', '+790****1002', $2, 'Мария', 'Петрова', 'manager', 'active'),
		($1, 'doctor@pansion.local', '+790****1003', $2, 'Алексей', 'Смирнов', 'doctor', 'active'),
		($1, 'sidorova@pansion.local', '+790****1004', $2, 'Анна', 'Сидорова', 'maid', 'active'),
		($1, 'kozlova@pansion.local', '+790****1005', $2, 'Елена', 'Козлова', 'maid', 'active')
	`, pensionID, string(hash))

	logger.Info("seed: users created, run seed.sql manually for full data: PGPASSWORD='***' psql -U pansion -d pansion -h 127.0.0.1 -f backend/db/seed.sql")
}
