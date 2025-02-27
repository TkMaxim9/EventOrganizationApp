package main

import (
	emailsendergrpc "Backend/internal/clients/emailsender/grpc"
	"Backend/internal/config"
	"Backend/internal/handlers/events"
	"Backend/internal/lib/logger/sl"
	"Backend/internal/lib/validator"
	"Backend/internal/storage/mysql"
	"context"
	"log/slog"
	_ "log/slog"
	"net/http"
	"os"
	"time"

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
	// Создание контекста с таймаутом
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// Вызов метода CreateNotification
	userEmail := "dogwok24@gmail.com"
	eventName := "Cristiano Analdu"
	eventTime := time.Now().Add(2*time.Hour + 3*time.Minute).Unix() // Текущее время в формате Unix timestamp

	notificationIDs, err := emailsenderclient.CreateNotification(ctx, userEmail, eventName, eventTime)
	if err != nil {
		log.Error("Ошибка при создании уведомления", slog.Any("error", err))
		os.Exit(1)
	}
	log.Info("Уведомления успешно созданы", slog.Any("notification_ids", notificationIDs))

	router := chi.NewRouter()

	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(middleware.URLFormat)

	events.Init(router, log, storage, validate)

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
