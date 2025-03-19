package mysql

import (
	"Backend/internal/storage"
	"database/sql"
	"fmt"
	"log"

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

func (r *Storage) DeleteEvent(eventID int) error {
	query := `DELETE FROM Event WHERE EventID = ?`

	result, err := r.db.Exec(query, eventID)
	if err != nil {
		return fmt.Errorf("mysql.DeleteEvent - query execution error: %w", err)
	}

	// Проверяем, было ли действительно удалено событие
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("mysql.DeleteEvent - couldn't get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("mysql.DeleteEvent - event with ID %d not found", eventID)
	}

	return nil
}

func (r *Storage) EditEvent(eventId int64, dto storage.EventCreateDto) error {
	const op = "storage.postgres.UpdateEvent"

	query := `
        UPDATE Event SET
            Title = ?,
            Description = ?,
            EventDate = ?,
            EventAddress = ?,
            VKLink = ?,
            TGLink = ?,
            ImageURL = ?
        WHERE EventID = ?
    `

	result, err := r.db.Exec(
		query,
		dto.Title,
		dto.Description,
		dto.EventDate,
		dto.EventAddress,
		dto.VKLink,
		dto.TGLink,
		dto.ImageURL,
		eventId,
	)

	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("%s: failed to get rows affected: %w", op, err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("%s: event with ID %d not found", op, eventId)
	}

	return nil
}

func (r *Storage) AddEvent(dto storage.EventCreateDto) (int64, error) {
	const op = "storage.postgres.AddEvent"

	query := `
        INSERT INTO Event (
            Title, 
            Description, 
            EventDate, 
            EventAddress,
            CreatorUserID, 
            VKLink, 
            TGLink, 
            ImageURL
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `

	result, err := r.db.Exec(
		query,
		dto.Title,
		dto.Description,
		dto.EventDate,
		dto.EventAddress,
		dto.CreatorUserID,
		dto.VKLink,
		dto.TGLink,
		dto.ImageURL,
	)

	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}

	return id, nil
}

func (r *Storage) GetEvent(eventId int) (storage.Event, error) {
	const op = "mysql.GetEvent"

	// Проверка на корректность ID
	if eventId <= 0 {
		return storage.Event{}, fmt.Errorf("%s - invalid event ID: %d", op, eventId)
	}

	query := `SELECT e.EventID, e.Title, e.Description, e.EventDate, e.EventAddress, 
                    e.CreatorUserID, e.VKLink, e.TGLink, e.ImageURL
              FROM Event e
              WHERE e.EventID = ?`

	// Для отладки: логирование запроса
	fmt.Printf("Executing query: %s with ID: %d\n", query, eventId)

	row := r.db.QueryRow(query, eventId)

	var event storage.Event
	err := row.Scan(
		&event.EventID,
		&event.Title,
		&event.Description,
		&event.EventDate,
		&event.EventAddress,
		&event.CreatorUserID,
		&event.VKLink,
		&event.TGLink,
		&event.ImageURL,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return storage.Event{}, fmt.Errorf("%s - event with ID %d not found", op, eventId)
		}
		return storage.Event{}, fmt.Errorf("%s - row scanning error: %w", op, err)
	}

	// Для отладки: вывод полученного события
	fmt.Printf("Retrieved event: %+v\n", event)

	return event, nil
}

func (r *Storage) GetFilteredEvents(title, date, address string) ([]storage.Event, error) {
	query := `SELECT e.EventID, e.Title, e.Description, e.EventDate, e.EventAddress, e.CreatorUserID, e.VKLink, e.TGLink, e.ImageURL,
               COUNT(er.UserID) as UsersCount
               FROM event e
               LEFT JOIN registration er ON e.EventID = er.EventID
               WHERE 1=1`

	args := []interface{}{}

	// Добавляем условия фильтрации, если параметры не пусты
	if title != "" {
		query += " AND e.Title LIKE ?"
		args = append(args, "%"+title+"%")
	}

	if date != "" {
		// Предполагаем, что дата приходит в формате YYYY-MM-DD
		query += " AND e.EventDate = ?"
		args = append(args, date)
	}

	// Фильтрация по адресу
	if address != "" {
		query += " AND e.EventAddress LIKE ?"
		args = append(args, "%"+address+"%")
	}

	// Добавляем GROUP BY, так как используем агрегатную функцию COUNT
	query += " GROUP BY e.EventID"

	// Сортируем по дате, чтобы сначала показывались ближайшие события
	query += " ORDER BY e.EventDate ASC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("mysql.GetFilteredEvents - query execution error: %w", err)
	}
	defer rows.Close()

	var events []storage.Event
	for rows.Next() {
		var e storage.Event
		var UsersCount int
		err := rows.Scan(
			&e.EventID,
			&e.Title,
			&e.Description,
			&e.EventDate,
			&e.EventAddress,
			&e.CreatorUserID,
			&e.VKLink,
			&e.TGLink,
			&e.ImageURL,
			&UsersCount,
		)
		if err != nil {
			return nil, fmt.Errorf("mysql.GetFilteredEvents - row scanning error: %w", err)
		}
		e.UsersCount = UsersCount
		events = append(events, e)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("mysql.GetFilteredEvents - rows iteration error: %w", err)
	}

	return events, nil
}

// AddUser добавляет нового пользователя в таблицу `users`.
func (s *Storage) AddUser(dto storage.CrateUserDto) (int64, error) {
	const op = "storage.AddUser"

	// Подготовка SQL-запроса для вставки нового пользователя
	stmt, err := s.db.Prepare("INSERT INTO User (FirstName, LastName, Email, ImageUrl) VALUES (?, ?, ?, ?)")
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	// Выполнение запроса
	res, err := stmt.Exec(dto.FirstName, dto.LastName, dto.Email, dto.ImageURL)
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}

	return id, nil
}

// RegisterUserForEvent регистрирует пользователя на мероприятие.
func (s *Storage) RegisterUserForEvent(userId int, eventId int) (userEmail string, eventName string, err error) {
	const op = "storage.RegisterUserForEvent"

	// Регистрируем пользователя на мероприятие
	_, err = s.db.Exec("INSERT INTO Registration (UserID, EventID) VALUES (?, ?)", userId, eventId)
	if err != nil {
		return "", "", fmt.Errorf("%s: %w", op, err)
	}

	// Получаем email пользователя
	err = s.db.QueryRow("SELECT Email FROM user WHERE ID = ?", userId).Scan(&userEmail)
	if err != nil {
		return "", "", fmt.Errorf("%s: failed to fetch user email: %w", op, err)
	}

	// Получаем название события
	err = s.db.QueryRow("SELECT Title FROM event WHERE ID = ?", eventId).Scan(&eventName)
	if err != nil {
		return "", "", fmt.Errorf("%s: failed to fetch event name: %w", op, err)
	}

	return userEmail, eventName, nil
}

func (r *Storage) GetUserInfo(userId int) (storage.UserInfo, error) {
	query := `SELECT u.Email, u.FirstName, u.LastName , u.ImageUrl
	          FROM User u 
	          WHERE u.UserID = ?`

	row := r.db.QueryRow(query, userId)

	var userInfo storage.UserInfo
	err := row.Scan(&userInfo.Email, &userInfo.FirstName, &userInfo.LastName, &userInfo.ImageUrl)
	if err != nil {
		if err == sql.ErrNoRows {
			return storage.UserInfo{}, fmt.Errorf("mysql.GetUserInfo - user with ID %d not found", userId)
		}
		return storage.UserInfo{}, fmt.Errorf("mysql.GetUserInfo - row scanning error: %w", err)
	}
	log.Printf("UserInfo: %+v", userInfo)

	return userInfo, nil
}

func (r *Storage) GetEventsByUser(userId int) ([]storage.Event, error) {
	query := `SELECT e.EventID, e.Title, e.Description, e.EventDate, e.EventAddress,
                   e.CreatorUserID, e.VKLink, e.TGLink, e.ImageURL,
                   COALESCE(COUNT(DISTINCT er.UserID), 0) as UsersCount
           FROM Event e
           LEFT JOIN registration er ON e.EventID = er.EventID
           WHERE e.CreatorUserID = ?
           GROUP BY e.EventID, e.Title, e.Description, e.EventDate, e.EventAddress,
                   e.CreatorUserID, e.VKLink, e.TGLink, e.ImageURL
           ORDER BY e.EventDate ASC`

	rows, err := r.db.Query(query, userId)
	if err != nil {
		return nil, fmt.Errorf("mysql.GetEventsByUser - query execution error: %w", err)
	}
	defer rows.Close()

	var events []storage.Event
	for rows.Next() {
		var e storage.Event
		err := rows.Scan(
			&e.EventID,
			&e.Title,
			&e.Description,
			&e.EventDate,
			&e.EventAddress,
			&e.CreatorUserID,
			&e.VKLink,
			&e.TGLink,
			&e.ImageURL,
			&e.UsersCount,
		)
		if err != nil {
			return nil, fmt.Errorf("mysql.GetEventsByUser - row scanning error: %w", err)
		}
		events = append(events, e)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("mysql.GetEventsByUser - rows iteration error: %w", err)
	}

	return events, nil
}

func (r *Storage) GetEventRegisteredUsers(eventId int) ([]storage.UserInfo, error) {
	query := `SELECT u.Email, u.FirstName, u.LastName, u.ImageUrl
              FROM User u
              JOIN Registration reg ON u.UserID = reg.UserID
              WHERE reg.EventID = ?`

	rows, err := r.db.Query(query, eventId)
	if err != nil {
		return nil, fmt.Errorf("mysql.GetEventRegisteredUsers - query error: %w", err)
	}
	defer rows.Close()

	var users []storage.UserInfo

	for rows.Next() {
		var user storage.UserInfo
		err := rows.Scan(&user.Email, &user.FirstName, &user.LastName, &user.ImageUrl)
		if err != nil {
			return nil, fmt.Errorf("mysql.GetEventRegisteredUsers - row scanning error: %w", err)
		}
		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("mysql.GetEventRegisteredUsers - rows iteration error: %w", err)
	}

	log.Printf("Found %d registered users for event ID %d", len(users), eventId)

	return users, nil
}
