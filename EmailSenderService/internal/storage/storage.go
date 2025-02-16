package storage

import (
	"time"
)

type Notification struct {
	ID         int       `json:"id,omitempty"` // ID уведомления (автоматически генерируется БД)
	UserEmail  string    `json:"user_email"`   // Email пользователя
	EventName  string    `json:"event_name"`   // Название мероприятия
	NotifyTime time.Time `json:"notify_time"`  // Время уведомления
	EventTime  time.Time `json:"event_time"`   // Время уведомления
}

type CreateNotificationDto struct {
	UserEmail string    `json:"user_email" validate:"required,email"` // Email пользователя (обязательное поле, должно быть валидным email)
	EventName string    `json:"event_name" validate:"required"`       // Название мероприятия (обязательное поле)
	EventTime time.Time `json:"notify_time" validate:"required"`      // Время уведомления (обязательное поле)
}
