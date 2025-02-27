package main

import (
	"EmailSenderService/config"
	"EmailSenderService/pkg/emailsender"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	pb "github.com/TkMaxim9/EventOrganizationApp/proto/notifications"
	"github.com/robfig/cron/v3"
	"google.golang.org/grpc"
)

func main() {
	// Инициализация хранилища
	config.InitStorage()

	// Создание gRPC-сервера
	s := grpc.NewServer()
	srv := &emailsender.GRPCServer{}
	pb.RegisterNotificationServiceServer(s, srv)

	// Настройка прослушивания TCP-порта
	l, err := net.Listen("tcp", ":2282")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	// Запуск gRPC-сервера в отдельной горутине
	go func() {
		log.Println("gRPC server is starting on port 2282...")
		if err := s.Serve(l); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()

	// Отложенное закрытие базы данных
	defer func() {
		if config.GlobalStorage != nil {
			config.GlobalStorage.Db.Close()
			log.Println("Database connection closed.")
		}
	}()

	// Настройка планировщика Cron
	c := cron.New()
	_, err = c.AddFunc("@every 1m", func() {
		config.GlobalStorage.ProcessNotifications()
	})
	if err != nil {
		log.Fatalf("Failed to add cron job: %v", err)
	}

	// Запуск планировщика
	c.Start()

	// Ожидание сигнала завершения программы
	log.Println("Press Ctrl+C to stop the server...")
	waitForShutdown()

	// Остановка gRPC-сервера
	s.GracefulStop()
	log.Println("gRPC server stopped.")
}

// waitForShutdown ожидает сигнал завершения программы (например, Ctrl+C)
func waitForShutdown() {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan
}
