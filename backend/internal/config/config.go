package config

import (
	"log/slog"
	"os"
)

type Config struct {
	ServerPort  string
	DatabaseURL string
	JWTSecret   string
	LogLevel    slog.Level
	WebAppDir   string // path to built web app for static serving
}

func Load() *Config {
	logLevel := slog.LevelInfo
	if os.Getenv("LOG_LEVEL") == "debug" {
		logLevel = slog.LevelDebug
	}

	return &Config{
		ServerPort:  getEnv("SERVER_PORT", ":8080"),
		DatabaseURL: getEnv("DATABASE_URL", "host=/var/run/postgresql dbname=pansion user=pansion password=pansion_secret sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "change-me-in-production-32char-secret-key!!"),
		LogLevel:    logLevel,
		WebAppDir:   getEnv("WEB_APP_DIR", "../web/dist"),
	}
}

func getEnv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}
