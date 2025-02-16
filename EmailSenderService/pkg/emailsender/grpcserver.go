package emailsender

import (
	// "EmailSenderService/pkg/services/eventemail"
	"EmailSenderService/config"
	"EmailSenderService/internal/storage"
	"context"
	"log"
	"os"
	"time"

	pb "github.com/TkMaxim9/EventOrganizationApp/proto/notifications"
)

type GRPCServer struct {
	pb.UnimplementedNotificationServiceServer
}

func (s *GRPCServer) CreateNotification(ctx context.Context, req *pb.CreateNotificationRequest) (*pb.CreateNotificationResponse, error) {
	// Преобразуем Unix timestamp в time.Time
	eventTime := time.Unix(req.GetEventTime(), 0)

	dto := storage.CreateNotificationDto{
		UserEmail: req.GetUserEmail(),
		EventName: req.GetEventName(),
		EventTime: eventTime,
	}

	ids, err := config.GlobalStorage.AddNotification(dto)
	if err != nil {
		log.Fatalf("error while adding notification")
		os.Exit(1)
	}

	return &pb.CreateNotificationResponse{
		NotificationIds: ids,
	}, nil
}

func (s *GRPCServer) DeleteNotifications(ctx context.Context, req *pb.DeleteNotificationsRequest) (*pb.DeleteNotificationsResponse, error) {
	ids := req.GetNotificationIds()

	err := config.GlobalStorage.DeleteNotifications(ids[0], ids[1])

	if err != nil {
		log.Fatalf("error while deleting notification")
		os.Exit(1)
	}

	return &pb.DeleteNotificationsResponse{
		Success: true,
	}, nil
}
