package grpc

import (
	"context"
	"fmt"
	"log/slog"

	emailsender "github.com/TkMaxim9/EventOrganizationApp/proto/notifications"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type Client struct {
	api emailsender.NotificationServiceClient
	log *slog.Logger
}

func New(
	log *slog.Logger,
	addr string,
) (*Client, error) {
	const op = "grpc.New"

	cc, err := grpc.NewClient(addr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	return &Client{
		api: emailsender.NewNotificationServiceClient(cc),
	}, nil
}

func (c *Client) CreateNotification(ctx context.Context, userEmail string, eventName string, eventTime int64) ([]int64, error) {
	const op = "grpc.CreateNtification"

	resp, err := c.api.CreateNotification(ctx, &emailsender.CreateNotificationRequest{
		EventName: eventName,
		EventTime: eventTime,
		UserEmail: userEmail,
	})
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	return resp.NotificationIds, nil
}

func (c *Client) DeleteNotifications(ctx context.Context, notificationIds []int64) (bool, error) {
	const op = "grpc.CreateNtification"

	resp, err := c.api.DeleteNotifications(ctx, &emailsender.DeleteNotificationsRequest{
		NotificationIds: notificationIds,
	})
	if err != nil {
		return false, fmt.Errorf("%s: %w", op, err)
	}
	return resp.Success, nil
}
