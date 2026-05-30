package app

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

// Run starts the HTTP server and blocks until SIGINT/SIGTERM.
// It performs graceful shutdown: stops accepting new requests,
// waits for in-flight requests to complete (up to timeout), then closes the DB pool.
func Run(srv *http.Server, logger *slog.Logger, onShutdown func()) {
	// Listen for OS signals in a goroutine.
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Start the server in its own goroutine.
	serverErr := make(chan error, 1)
	go func() {
		logger.Info("server starting", "addr", srv.Addr)
		serverErr <- srv.ListenAndServe()
	}()

	// Wait for either a signal or a server error.
	select {
	case sig := <-sigChan:
		logger.Info("shutdown signal received", "signal", sig.String())
	case err := <-serverErr:
		if err != nil && err != http.ErrServerClosed {
			logger.Error("server error", "error", err)
		}
	}

	// Run custom shutdown hook (close DB pool, etc.).
	if onShutdown != nil {
		onShutdown()
	}

	// Graceful shutdown with a 10-second timeout.
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("graceful shutdown failed", "error", err)
	} else {
		logger.Info("server stopped gracefully")
	}
}
