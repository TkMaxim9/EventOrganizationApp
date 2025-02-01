package emailsender

import (
	"EmailSenderService/pkg/api"
	"EmailSenderService/pkg/services/eventemail"
	"context"
)

type GRPCServer struct {
	api.UnimplementedEmailSenderServer
}

func (s *GRPCServer) SendEventNotification(ctx context.Context, req *api.SendEventNotificationRequest) (*api.SendEventNotificationResponse, error) {
	res, err := eventemail.SendEventNotification(req.GetEmailAddresses(), req.GetEventName(), req.GetEventDate())

	return &api.SendEventNotificationResponse{
		IsSucceed: res,
		Message:   "Email request done",
	}, err
}
