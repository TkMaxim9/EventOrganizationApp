package main

import (
	"EmailSenderService/config"
	"EmailSenderService/pkg/emailsender"
	"log"
	"net"

	pb "github.com/TkMaxim9/EventOrganizationApp/proto/notifications"
	"github.com/robfig/cron/v3"
	"google.golang.org/grpc"
)

func main() {
	config.InitStorage()

	s := grpc.NewServer()

	srv := &emailsender.GRPCServer{}
	pb.RegisterNotificationServiceServer(s, srv)

	l, err := net.Listen("tcp", ":2282")
	if err != nil {
		log.Fatal(err)
	}

	if err := s.Serve(l); err != nil {
		log.Fatal(err)
	}

	defer func() {
		if config.GlobalStorage != nil {
			config.GlobalStorage.Db.Close()
			log.Println("Database connection closed.")
		}
	}()

	c := cron.New()

	// Добавляем задачу на выполнение каждую минуту
	_, err = c.AddFunc("@every 1m", func() {
		config.GlobalStorage.ProcessNotifications()
	})
	if err != nil {
		log.Fatalf("Failed to add cron job: %v", err)
	}

	// Запускаем планировщик
	c.Start()
}
