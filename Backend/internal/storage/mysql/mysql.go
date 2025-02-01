package mysql

import (
	"Backend/internal/storage"
	"database/sql"
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

type Storage struct {
	db *sql.DB
}

func New(storagePath string) (*Storage, error) {
	const op = "storage.mysql.New"

	db, err := sql.Open("mysql", storagePath)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	driver, _ := mysql.WithInstance(db, &mysql.Config{})
	m, _ := migrate.NewWithDatabaseInstance(
		"file://./migrations",
		"mysql",
		driver,
	)
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return nil, fmt.Errorf("%s: error applying migrations: %w", op, err)
	}

	return &Storage{db: db}, nil
}

func (s *Storage) AddEvent(dto storage.EventCreateDto) (int64, error) {
	const op = "storage.CreateEvent"

	stmt, err := s.db.Prepare("INSERT INTO events (title, description, start_time, end_time, user_id) VALUES (?, ?, ?, ?, ?)")
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}

	res, err := stmt.Exec(dto.Title, dto.Description, dto.StartTime, dto.EndTime, dto.UserID)
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}

	return id, nil
}

// AddUser добавляет нового пользователя в таблицу `users`.
func (s *Storage) AddUser(name string, email string, password string) (int64, error) {
	const op = "storage.AddUser"

	// Подготовка SQL-запроса для вставки нового пользователя
	stmt, err := s.db.Prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	// Выполнение запроса
	res, err := stmt.Exec(name, email, password)
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}

	// Получаем ID последнего вставленного пользователя
	id, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}

	return id, nil
}

// RegisterUserForEvent регистрирует пользователя на мероприятие.
func (s *Storage) RegisterUserForEvent(userId int, eventId int) (int64, error) {
	const op = "storage.RegisterUserForEvent"

	// Подготовка SQL-запроса для регистрации пользователя на мероприятие
	stmt, err := s.db.Prepare("INSERT INTO event_registrations (user_id, event_id) VALUES (?, ?)")
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	// Выполнение запроса
	res, err := stmt.Exec(userId, eventId)
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}

	// Получаем ID последней регистрации
	id, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}

	return id, nil
}

func (s *Storage) GetAllEvents() ([]storage.Event, error) {
	const op = "storage.GetAllEvents"

	// SQL-запрос для получения всех событий
	rows, err := s.db.Query("SELECT id, title, description, start_time, end_time, user_id FROM events")
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	defer rows.Close()

	// Срез для хранения событий
	var events []storage.Event

	// Итерация по строкам результата
	for rows.Next() {
		var event storage.Event
		err := rows.Scan(&event.ID, &event.Title, &event.Description, &event.StartTime, &event.EndTime, &event.UserID)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", op, err)
		}
		events = append(events, event)
	}

	// Проверка на ошибки, возникшие во время итерации
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	return events, nil
}
