package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	app2 "github.com/ferzferz11-sudo/pansion/internal/app"
	"github.com/ferzferz11-sudo/pansion/internal/config"
	"github.com/ferzferz11-sudo/pansion/internal/db"
	"github.com/ferzferz11-sudo/pansion/internal/domain"
	handlerAuth "github.com/ferzferz11-sudo/pansion/internal/handler/auth"
	handlerMaid "github.com/ferzferz11-sudo/pansion/internal/handler/maid"
	handlerRoom "github.com/ferzferz11-sudo/pansion/internal/handler/room"
	handlerSos "github.com/ferzferz11-sudo/pansion/internal/handler/sos"
	repoMaid "github.com/ferzferz11-sudo/pansion/internal/repository/maid"
	repoRoom "github.com/ferzferz11-sudo/pansion/internal/repository/room"
	repoSos "github.com/ferzferz11-sudo/pansion/internal/repository/sos"
	repoUser "github.com/ferzferz11-sudo/pansion/internal/repository/user"
	setRepo "github.com/ferzferz11-sudo/pansion/internal/repository/settings"
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

	sR := setRepo.NewRepository(pool)
	mountAdminRoutes(r, jwtSvc, userRepo, sR)

	// Dashboard stats (inline JWT auth).
	r.Get("/api/v1/dashboard", func(w http.ResponseWriter, r *http.Request) {
		auth_h := r.Header.Get("Authorization")
		if len(auth_h) < 8 { writeJSON(w, 401, errResp("Unauthorized")); return }
		claims, err := jwtSvc.Validate(auth_h[7:])
		if err != nil { writeJSON(w, 401, errResp("Invalid token")); return }
		pid := claims.PensionID

		type stat struct {
			Table string
			Count int
		}
		stats := []stat{}
		for _, table := range []string{"rooms","guests","users","maid_tasks","transactions"} {
			var n int
			_ = pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM "+table+" WHERE pension_id=$1", pid).Scan(&n)
			stats = append(stats, stat{Table: table, Count: n})
		}
		// Rooms by status.
		type rs struct {
			Status string
			Count  int
		}
		roomStats := []rs{}
		if rows, err := pool.Query(r.Context(), "SELECT status, COUNT(*) FROM rooms WHERE pension_id=$1 GROUP BY status", pid); err == nil {
			defer rows.Close()
			for rows.Next() {
				var s rs
				rows.Scan(&s.Status, &s.Count)
				roomStats = append(roomStats, s)
			}
		}
		// Finance summary.
		var income, expense float64
		_ = pool.QueryRow(r.Context(),
			"SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0), COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) FROM transactions WHERE pension_id=$1", pid,
		).Scan(&income, &expense)
		// Active SOS.
		var sosCount int
		_ = pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM sos_signals WHERE pension_id=$1 AND status='active'", pid).Scan(&sosCount)

		writeJSON(w, 200, map[string]interface{}{
			"stats":      stats,
			"room_stats": roomStats,
			"finance":    map[string]float64{"income": income, "expense": expense, "balance": income - expense},
			"sos_active": sosCount,
		})
	})

	seedAdmin(ctx, pool, logger, sR)

	srv := &http.Server{Addr: cfg.ServerPort, Handler: r,
		ReadTimeout: 10 * time.Second, WriteTimeout: 15 * time.Second, IdleTimeout: 60 * time.Second}
	app2.Run(srv, logger, func() { logger.Info("closing..."); pool.Close() })
}

func mountAdminRoutes(r chi.Router, jwtSvc *service.JWTService,
	userRepo *repoUser.Repository, sR *setRepo.Repository) {

	r.Group(func(rr chi.Router) {
		rr.Use(jwtAuthMW(jwtSvc))
		rr.Use(roleGuardMW("owner", "manager"))

		// Users CRUD.
		rr.Get("/api/v1/users", func(w http.ResponseWriter, r *http.Request) {
			pid := ctxStr(r, "pid")
			users, err := userRepo.ListAll(r.Context(), pid)
			if err != nil { writeJSON(w, 500, errResp("Ошибка загрузки")); return }
			type uv struct {
				ID        string `json:"id"`
				Email     string `json:"email"`
				Phone     string `json:"phone"`
				FirstName string `json:"first_name"`
				LastName  string `json:"last_name"`
				Role      string `json:"role"`
				Status    string `json:"status"`
			}
			out := make([]uv, len(users))
			for i, u := range users {
				out[i] = uv{u.ID, u.Email, u.Phone, u.FirstName, u.LastName, u.Role, u.Status}
			}
			writeJSON(w, 200, out)
		})

		rr.Post("/api/v1/users", func(w http.ResponseWriter, r *http.Request) {
			pid := ctxStr(r, "pid")
			var b struct {
				Email     string `json:"email"`
				Phone     string `json:"phone"`
				FirstName string `json:"first_name"`
				LastName  string `json:"last_name"`
				Role      string `json:"role"`
				Password  string `json:"password"`
			}
			json.NewDecoder(r.Body).Decode(&b)
			if b.Password == "" { b.Password = "1234" }
			email := b.Email
			if email == "" { email = b.FirstName + "@pansion.local" }
			hash, _ := bcrypt.GenerateFromPassword([]byte(b.Password), bcrypt.DefaultCost)
			err := userRepo.Create(r.Context(), &domain.User{
				PensionID: pid, Email: email, Phone: b.Phone, PasswordHash: string(hash),
				FirstName: b.FirstName, LastName: b.LastName, Role: b.Role, Status: "active",
			})
			if err != nil { writeJSON(w, 400, errResp(err.Error())); return }
			writeJSON(w, 201, okResp("created"))
		})

		rr.Put("/api/v1/users", func(w http.ResponseWriter, r *http.Request) {
			var b struct {
				ID        string `json:"id"`
				Email     string `json:"email"`
				Phone     string `json:"phone"`
				FirstName string `json:"first_name"`
				LastName  string `json:"last_name"`
				Role      string `json:"role"`
				Status    string `json:"status"`
			}
			json.NewDecoder(r.Body).Decode(&b)
			err := userRepo.Update(r.Context(), &domain.User{
				ID: b.ID, Email: b.Email, Phone: b.Phone,
				FirstName: b.FirstName, LastName: b.LastName, Role: b.Role, Status: b.Status,
			})
			if err != nil { writeJSON(w, 400, errResp("Ошибка обновления: "+err.Error())); return }
			writeJSON(w, 200, okResp("ok"))
		})

		rr.Delete("/api/v1/users", func(w http.ResponseWriter, r *http.Request) {
			id := r.URL.Query().Get("id")
			if id == "" { writeJSON(w, 400, errResp("Не указан ID")); return }
			err := userRepo.Delete(r.Context(), id)
			if err != nil { writeJSON(w, 400, errResp(err.Error())); return }
			writeJSON(w, 200, okResp("deleted"))
		})

		// Settings: tab visibility.
		rr.Get("/api/v1/settings/tabs", func(w http.ResponseWriter, r *http.Request) {
			pid := ctxStr(r, "pid")
			role := r.URL.Query().Get("role")
			tabs, err := sR.GetTabs(r.Context(), pid, role)
			if err != nil { writeJSON(w, 500, errResp("Ошибка")); return }
			writeJSON(w, 200, tabs)
		})
		rr.Post("/api/v1/settings/tabs", func(w http.ResponseWriter, r *http.Request) {
			pid := ctxStr(r, "pid")
			var b struct{ Role, TabKey string; Visible bool }
			json.NewDecoder(r.Body).Decode(&b)
			err := sR.SetTabs(r.Context(), pid, b.TabKey, b.Role, b.Visible)
			if err != nil { writeJSON(w, 400, errResp(err.Error())); return }
			writeJSON(w, 200, okResp("ok"))
		})
	})
}

// === middleware ===

func jwtAuthMW(jwtSvc *service.JWTService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			auth := r.Header.Get("Authorization")
			if len(auth) < 8 { http.Error(w, `{"error":"требуется авторизация"}`, 401); return }
			claims, err := jwtSvc.Validate(auth[7:])
			if err != nil { http.Error(w, `{"error":"неверный токен"}`, 401); return }
			ctx := context.WithValue(r.Context(), ctxK("uid"), claims.UserID)
			ctx = context.WithValue(ctx, ctxK("role"), claims.Role)
			ctx = context.WithValue(ctx, ctxK("pid"), claims.PensionID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func roleGuardMW(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := ctxStr(r, "role")
			ok := false
			for _, allowed := range roles {
				if role == allowed { ok = true; break }
			}
			if !ok { http.Error(w, `{"error":"доступ запрещён"}`, 403); return }
			next.ServeHTTP(w, r)
		})
	}
}

// === helpers ===

type ctxK string

func ctxStr(r *http.Request, key string) string {
	v, _ := r.Context().Value(ctxK(key)).(string)
	return v
}

func errResp(msg string) map[string]string  { return map[string]string{"error": msg} }
func okResp(status string) map[string]string { return map[string]string{"status": status} }

func writeJSON(w http.ResponseWriter, code int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}

// === seed ===

func seedAdmin(ctx context.Context, pool *pgxpool.Pool, logger *slog.Logger, sR *setRepo.Repository) {
	defer func() { if r := recover(); r != nil { logger.Warn("seed panic", "error", r) } }()

	var exists bool
	err := pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users LIMIT 1)").Scan(&exists)
	if err != nil || exists {
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)

	var pensionID string
	err = pool.QueryRow(ctx,
		"INSERT INTO pensions (name, address) VALUES ('Родные Пенаты — Крым', 'Крым, Ялта, ул. Морская, 12') RETURNING id",
	).Scan(&pensionID)
	if err != nil { logger.Error("seed: pension failed", "error", err); return }

	_, _ = pool.Exec(ctx, `
		INSERT INTO users (pension_id, email, phone, password_hash, first_name, last_name, role, status) VALUES
		($1,'admin@pansion.local','+790****1000',$2,'Админ','Системы','owner','active'),
		($1,'manager@pansion.local','+790****1002',$2,'Мария','Петрова','manager','active'),
		($1,'doctor@pansion.local','+790****1003',$2,'Алексей','Смирнов','doctor','active'),
		($1,'sidorova@pansion.local','+790****1004',$2,'Анна','Сидорова','maid','active'),
		($1,'kozlova@pansion.local','+790****1005',$2,'Елена','Козлова','maid','active')
	`, pensionID, string(hash))

	if err := sR.InitDefaults(ctx, pensionID); err != nil {
		logger.Warn("seed: role_tabs init failed", "error", err)
	}

	logger.Info("seed: demo users + role_tabs created")
}
