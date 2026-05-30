package main

import (
	"context"
	"fmt"
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

	r := server.New(cfg, jwtSvc, wsHub, logger, authH, maidH, sosH, roomH)

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

// seedAdmin creates admin@pansion.local if users table is empty.
// Also seeds demo rooms and tasks so the UI is not empty on first load.
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

	var pensionID string
	err = pool.QueryRow(ctx, `
		INSERT INTO pensions (name, address) VALUES ('Родные Пенаты - Москва', 'г. Москва, ул. Пансионная, 1')
		RETURNING id
	`).Scan(&pensionID)
	if err != nil {
		logger.Warn("seed: pension insert failed", "error", err)
		return
	}

	_, err = pool.Exec(ctx, `
		INSERT INTO users (pension_id, email, password_hash, first_name, last_name, role, status)
		VALUES ($1, 'admin@pansion.local', $2, 'Админ', 'Системы', 'owner', 'active')
	`, pensionID, string(hash))
	if err != nil {
		logger.Warn("seed: admin insert failed", "error", err)
		return
	}
	logger.Info("seed: admin created — admin@pansion.local / admin123")

	// Seed 30 rooms (3 floors × 10 rooms) with demo tasks.
	statuses := []string{"vacant", "vacant", "vacant", "booked", "occupied", "occupied", "checking_out_today"}
	taskTypes := []string{"linen_change", "wet_cleaning", "watering_flowers"}

	inserted := 0
	for floor := 1; floor <= 3; floor++ {
		for n := 1; n <= 10; n++ {
			roomNum := fmt.Sprintf("%d%02d", floor, n)
			status := statuses[(floor*3+n)%len(statuses)]
			var roomID string
			err := pool.QueryRow(ctx,
				"INSERT INTO rooms (pension_id, number, floor, status) VALUES ($1,$2,$3,$4) RETURNING id",
				pensionID, roomNum, floor, status,
			).Scan(&roomID)
			if err != nil {
				continue
			}
			inserted++

			// 0-2 tasks per room.
			for t := 0; t < n%3; t++ {
				_, _ = pool.Exec(ctx,
					"INSERT INTO maid_tasks (room_id, task_type, status) VALUES ($1,$2,'pending')",
					roomID, taskTypes[t%len(taskTypes)],
				)
			}
		}
	}
	logger.Info("seed: demo data created", "rooms", inserted)
}
