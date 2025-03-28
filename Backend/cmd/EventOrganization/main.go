package main

import (
	emailsendergrpc "Backend/internal/clients/emailsender/grpc"
	"Backend/internal/config"
	"Backend/internal/handlers/events"
	"Backend/internal/lib/logger/sl"
	"Backend/internal/lib/validator"
	"Backend/internal/storage/mysql"
	"log/slog"
	_ "log/slog"
	"net/http"
	"os"

	"github.com/go-chi/cors"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	vallib "github.com/go-playground/validator/v10"
)

const (
	envLocal = "local"
	envDev   = "dev"
	envProd  = "prod"
)

func main() {
	cfg := config.MustLoad()

	log := setupLogger(cfg.Env)

	log.Info("starting app", slog.String("env", cfg.Env))
	log.Debug("debug messages are enabled")

	storage, err := mysql.New("root:3392Mm!!@tcp(127.0.0.1:3306)/EventsOrgDB?multiStatements=true&parseTime=true")
	if err != nil {
		log.Error("failed to load storage", sl.Err(err))
		os.Exit(1)
	}

	_ = storage

	validate := vallib.New()

	// Регистрируем кастомные валидаторы
	err = validator.RegisterCustomValidators(validate)
	if err != nil {
		log.Error("Ошибка при регистрации валидаторов: %v", err)
	}

	emailsenderclient, err := emailsendergrpc.New(log, "localhost:2282")
	if err != nil {
		log.Error("Ошибка при подключении к сервису отправки уведомлений: %v", err)
	}

	router := chi.NewRouter()

	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // В продакшене лучше указать конкретный домен, например, "http://localhost:3000"
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Максимальное время кэширования (в секундах) для preflight запросов
	})

	router.Use(corsMiddleware.Handler)
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(middleware.URLFormat)

	events.Init(router, log, storage, validate, emailsenderclient)

	log.Info("starting server", slog.String("address", cfg.Address))

	srv := http.Server{
		Addr:         cfg.Address,
		Handler:      router,
		ReadTimeout:  cfg.HTTPServer.Timeout,
		WriteTimeout: cfg.HTTPServer.Timeout,
		IdleTimeout:  cfg.HTTPServer.IdleTimeout,
	}

	if err := srv.ListenAndServe(); err != nil {
		log.Error("failed to start server", sl.Err(err))
	}

	log.Error("server stopped")
}

func setupLogger(env string) *slog.Logger {
	var log *slog.Logger

	switch env {
	case envLocal:
		log = slog.New(
			slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}),
		)
	case envDev:
		log = slog.New(
			slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}),
		)
	case envProd:
		log = slog.New(
			slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}),
		)
	}

	return log
}
