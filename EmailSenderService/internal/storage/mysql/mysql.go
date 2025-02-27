package mysql

import (
	"EmailSenderService/internal/storage"
	"EmailSenderService/pkg/services/eventemail"
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

type Storage struct {
	Db *sql.DB
}

func New(storagePath string) (*Storage, error) {
	const op = "storage.mysql.New"

	db, err := sql.Open("mysql", storagePath)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	driver, err := mysql.WithInstance(db, &mysql.Config{})
	if err != nil {
		return nil, fmt.Errorf("%s: failed to create MySQL driver: %w", op, err)
	}
	m, err := migrate.NewWithDatabaseInstance(
		"file://./migrations",
		"mysql",
		driver,
	)
	if err != nil {
		return nil, fmt.Errorf("%s: failed to initialize migrations: %w", op, err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return nil, fmt.Errorf("%s: error applying migrations: %w", op, err)
	}

	return &Storage{Db: db}, nil
}

func (s *Storage) AddNotification(dto storage.CreateNotificationDto) ([]int64, error) {
	const op = "storage.AddNotification"

	dayBefore := dto.EventTime.Add(-24 * time.Hour)
	twoHoursBefore := dto.EventTime.Add(-2 * time.Hour)

	var ids []int64

	createNotification := func(notifyTime time.Time) (int64, error) {
		stmt, err := s.Db.Prepare(`
            INSERT INTO notifications (user_email, event_name, event_time, notify_time)
            VALUES (?, ?, ?, ?)
        `)
		if err != nil {
			return 0, fmt.Errorf("%s: failed to prepare statement: %w", op, err)
		}
		defer stmt.Close()

		res, err := stmt.Exec(dto.UserEmail, dto.EventName, dto.EventTime, notifyTime)
		if err != nil {
			return 0, fmt.Errorf("%s: failed to insert notification: %w", op, err)
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			return 0, fmt.Errorf("%s: failed to get last insert ID: %w", op, err)
		}

		return lastID, nil
	}

	id1, err := createNotification(dayBefore)
	if err != nil {
		return nil, fmt.Errorf("%s: failed to create day-before notification: %w", op, err)
	}
	ids = append(ids, id1)

	id2, err := createNotification(twoHoursBefore)
	if err != nil {
		return nil, fmt.Errorf("%s: failed to create two-hours-before notification: %w", op, err)
	}
	ids = append(ids, id2)

	return ids, nil
}

func (s *Storage) DeleteNotifications(id1, id2 int64) error {
	const op = "storage.DeleteNotifications"

	// Функция для удаления одной записи по ID
	deleteNotification := func(id int64) error {
		stmt, err := s.Db.Prepare("DELETE FROM notifications WHERE id = ?")
		if err != nil {
			return fmt.Errorf("%s: failed to prepare statement: %w", op, err)
		}
		defer stmt.Close()

		res, err := stmt.Exec(id)
		if err != nil {
			return fmt.Errorf("%s: failed to delete notification with ID %d: %w", op, id, err)
		}

		rowsAffected, err := res.RowsAffected()
		if err != nil {
			return fmt.Errorf("%s: failed to check rows affected for ID %d: %w", op, id, err)
		}

		if rowsAffected == 0 {
			return fmt.Errorf("%s: no notification found with ID %d", op, id)
		}

		return nil
	}

	// Удаляем первую запись
	if err := deleteNotification(id1); err != nil {
		return fmt.Errorf("%s: failed to delete first notification: %w", op, err)
	}

	// Удаляем вторую запись
	if err := deleteNotification(id2); err != nil {
		return fmt.Errorf("%s: failed to delete second notification: %w", op, err)
	}

	return nil
}

func (s *Storage) ProcessNotifications() {
	rows, err := s.Db.Query(`
        SELECT id, user_email, event_name, event_time, notify_time
        FROM notifications
        WHERE notify_time <= NOW()
    `)
	if err != nil {
		log.Printf("Error querying notifications: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var userEmail, eventName string
		var notifyTime, eventTime time.Time

		// Считываем данные уведомления
		if err := rows.Scan(&id, &userEmail, &eventName, &eventTime, &notifyTime); err != nil {
			log.Printf("Error scanning notification row: %v", err)
			continue
		}

		// Отправляем уведомление
		if _, err := eventemail.SendEventNotification(userEmail, eventName, eventTime.Format("2006-01-02 15:04:05")); err != nil {
			log.Printf("Failed to send notification to %s: %v", userEmail, err)
			continue
		}

		// Удаляем уведомление из базы данных
		_, err := s.Db.Exec("DELETE FROM notifications WHERE id = ?", id)
		if err != nil {
			log.Printf("Failed to delete notification with ID %d: %v", id, err)
		}
	}
}
