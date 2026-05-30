package auth

import (
	"context"
	"fmt"
	"log/slog"

	"golang.org/x/crypto/bcrypt"

	"github.com/ferzferz11-sudo/pansion/internal/domain"
	"github.com/ferzferz11-sudo/pansion/internal/service"
)

// Usecase contains business logic for authentication.
type Usecase struct {
	userRepo domain.UserRepository
	jwt      *service.JWTService
	logger   *slog.Logger
}

// NewUsecase creates an auth usecase. userRepo is injected (dependency inversion).
func NewUsecase(userRepo domain.UserRepository, jwt *service.JWTService, logger *slog.Logger) *Usecase {
	return &Usecase{userRepo: userRepo, jwt: jwt, logger: logger}
}

// Login authenticates a user by email and returns a JWT token.
func (u *Usecase) Login(ctx context.Context, req domain.LoginRequest) (domain.LoginResponse, error) {
	if req.Email == "" {
		return domain.LoginResponse{}, fmt.Errorf("email is required")
	}

	user, err := u.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		u.logger.Warn("login failed: user not found", "email", req.Email)
		return domain.LoginResponse{}, fmt.Errorf("invalid credentials")
	}

	if user.Status == "fired" {
		u.logger.Warn("login rejected: user fired", "user_id", user.ID)
		return domain.LoginResponse{}, fmt.Errorf("account is deactivated")
	}

	// bcrypt.CompareHashAndPassword resists timing attacks.
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		u.logger.Warn("login failed: wrong password", "user_id", user.ID)
		return domain.LoginResponse{}, fmt.Errorf("invalid credentials")
	}

	token, err := u.jwt.Generate(user.ID, user.PensionID, user.Role)
	if err != nil {
		return domain.LoginResponse{}, fmt.Errorf("generate token: %w", err)
	}

	u.logger.Info("user logged in", "user_id", user.ID, "role", user.Role)
	return domain.LoginResponse{Token: token, User: *user}, nil
}
