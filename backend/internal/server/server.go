package server

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ferzferz11-sudo/pansion/internal/config"
	"github.com/ferzferz11-sudo/pansion/internal/handler/auth"
	"github.com/ferzferz11-sudo/pansion/internal/handler/finance"
	"github.com/ferzferz11-sudo/pansion/internal/handler/guest"
	"github.com/ferzferz11-sudo/pansion/internal/handler/maid"
	"github.com/ferzferz11-sudo/pansion/internal/handler/room"
	"github.com/ferzferz11-sudo/pansion/internal/handler/sos"
	hws "github.com/ferzferz11-sudo/pansion/internal/handler/ws"
	"github.com/ferzferz11-sudo/pansion/internal/middleware"
	finRepo "github.com/ferzferz11-sudo/pansion/internal/repository/finance"
	guestRepo "github.com/ferzferz11-sudo/pansion/internal/repository/guest"
	"github.com/ferzferz11-sudo/pansion/internal/service"
	pkgws "github.com/ferzferz11-sudo/pansion/internal/ws"
)

func New(cfg *config.Config, jwtSvc *service.JWTService, wsHub *pkgws.Hub, logger *slog.Logger,
	authH *auth.Handler, maidH *maid.Handler, sosH *sos.Handler, roomH *room.Handler,
	pool *pgxpool.Pool) *chi.Mux {

	r := chi.NewRouter()

	r.Use(middleware.Recovery(logger))
	r.Use(middleware.CORS)
	r.Use(middleware.Logging(logger))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})
	r.Post("/api/v1/auth/login", authH.Login)

	r.Group(func(r chi.Router) {
		r.Use(middleware.Authenticate(jwtSvc, logger))

		r.Get("/api/v1/maid/tasks", maidH.GetTasks)
		r.Post("/api/v1/maid/tasks/complete", maidH.Complete)
		r.Post("/api/v1/sos", sosH.Create)
		r.Get("/api/v1/sos", sosH.GetActive)
		r.Get("/api/v1/rooms/chessboard", roomH.GetChessboard)

		// Guests
		gr := guestRepo.NewRepository(pool)
		r.Get("/api/v1/guests", guest.NewHandler(func(r *http.Request) ([]map[string]interface{}, error) {
			pensionID := middleware.PensionID(r.Context())
			rows, err := gr.List(r.Context(), pensionID)
			if err != nil {
				return nil, err
			}
			result := make([]map[string]interface{}, len(rows))
			for i, g := range rows {
				result[i] = map[string]interface{}{
					"id": g.ID, "first_name": g.FirstName, "last_name": g.LastName,
					"middle_name": g.MiddleName, "diet_type": g.DietType,
					"character_notes": g.CharacterNotes, "status": g.Status,
					"room_number": g.RoomNumber,
				}
			}
			return result, nil
		}).GetGuests)

		// Finance
		fR := finRepo.NewRepository(pool)
		r.Get("/api/v1/finance", finance.NewHandler(func(r *http.Request) ([]map[string]interface{}, error) {
			pensionID := middleware.PensionID(r.Context())
			txns, err := fR.List(r.Context(), pensionID)
			if err != nil {
				return nil, err
			}
			result := make([]map[string]interface{}, len(txns))
			for i, t := range txns {
				result[i] = map[string]interface{}{
					"id": t.ID, "type": t.Type, "amount": t.Amount,
					"category": t.Category, "description": t.Description,
					"created_at": t.CreatedAt,
				}
			}
			return result, nil
		}).GetTransactions)

		r.Get("/api/v1/finance/summary", finance.NewHandler(nil).GetSummary)

		wsHandler := hws.NewHandler(wsHub, logger)
		r.Get("/api/v1/ws", wsHandler.Serve)
	})

	return r
}
