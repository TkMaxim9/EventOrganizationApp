package storage

import "time"

type Event struct {
	ID          int64     `json:"id"`          // Поле `id` в таблице
	Title       string    `json:"title"`       // Поле `title` в таблице
	Description string    `json:"description"` // Поле `description` в таблице
	StartTime   time.Time `json:"start_time"`  // Поле `start_time` в таблице
	EndTime     time.Time `json:"end_time"`    // Поле `end_time` в таблице
	CreatedAt   time.Time `json:"created_at"`  // Поле `created_at` в таблице
	UserID      int64     `json:"user_id"`
}

type EventCreateDto struct {
	Title       string    `json:"title"`       // Поле `title` в таблице
	Description string    `json:"description"` // Поле `description` в таблице
	StartTime   time.Time `json:"start_time"`  // Поле `start_time` в таблице
	EndTime     time.Time `json:"end_time"`    // Поле `end_time` в таблице
	UserID      int64     `json:"user_id"`
}
