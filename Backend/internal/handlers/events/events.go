package events

import (
	// emailsendergrpc "Backend/internal/clients/emailsender/grpc"
	"Backend/internal/lib/response"
	"Backend/internal/storage"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
	"github.com/go-playground/validator/v10"
)

const (
	// Путь для сохранения изображений
	uploadDir = "./uploads/images"
	// Максимальный размер файла (10 МБ)
	maxUploadSize = 10 * 1024 * 1024
)

type Response struct {
	response.Response
	Events      []storage.Event          `json:"events,omitempty"`
	EventCards  []storage.EventCardProps `json:"eventCards,omitempty"`
	EventId     int64                    `json:"eventId,omitempty"`
	UserId      int64                    `json:"userId,omitempty"`
	ProfileInfo storage.ProfileInfo      `json:"profileInfo,omitempty"`
}

type RegisterRequest struct {
	UserID  int `json:"userId"`
	EventID int `json:"eventId"`
}

type CreateRequest struct {
	Event storage.EventCreateDto `json:"event" validate:"required,event"`
}

type EventStorage interface {
	AddEvent(dto storage.EventCreateDto) (int64, error)
	AddUser(dto storage.CrateUserDto) (int64, error)
	GetEventsByUser(userId int) ([]storage.Event, error)
	GetUserInfo(userId int) (storage.UserInfo, error)
	// EditEvent()
	// DeleteEvent()
	RegisterUserForEvent(userId int, eventId int) error
	GetFilteredEvents(title, date, address string) ([]storage.Event, error)
}

func eventValidator(fl validator.FieldLevel) bool {
	event, ok := fl.Field().Interface().(storage.EventCreateDto)
	if !ok {
		return false
	}

	return event.Title != ""
}

func generateRandomFilename(originalFilename string) string {
	// Получаем расширение файла
	ext := filepath.Ext(originalFilename)

	// Генерируем случайную строку
	randomBytes := make([]byte, 16)
	rand.Read(randomBytes)
	randomStr := hex.EncodeToString(randomBytes)

	// Возвращаем новое имя файла
	return randomStr + ext
}

// Обработчик для создания события с загрузкой изображения
func CreateEventHandler(log *slog.Logger, eventStorage EventStorage, validate *validator.Validate) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.events.CreateEvent"

		// Ограничиваем размер запроса
		r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

		// Парсим multipart форму
		if err := r.ParseMultipartForm(maxUploadSize); err != nil {
			log.Error(op, "failed to parse multipart form", err)
			render.JSON(w, r, response.Error("Ошибка при обработке формы"))
			return
		}

		// Получаем JSON данные события из формы
		eventJSON := r.FormValue("event")
		if eventJSON == "" {
			log.Error(op, "event data not found in form", nil)
			render.JSON(w, r, response.Error("Данные события не найдены"))
			return
		}

		// Декодируем JSON данные события
		var eventDto storage.EventCreateDto
		if err := json.Unmarshal([]byte(eventJSON), &eventDto); err != nil {
			log.Error(op, "failed to decode event JSON", err)
			render.JSON(w, r, response.Error("Некорректный формат данных события"))
			return
		}

		// Проверяем валидность данных события
		err := validate.Struct(eventDto)
		if err != nil {
			log.Error(op, "validation failed", err)
			render.JSON(w, r, response.Error("Ошибка валидации данных события"))
			return
		}

		// Получаем файл изображения из формы
		file, fileHeader, err := r.FormFile("image")
		if err == nil { // Если изображение предоставлено
			defer file.Close()

			// Создаем директорию для загрузки, если она не существует
			if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
				log.Error(op, "failed to create upload directory", err)
				render.JSON(w, r, response.Error("Ошибка сервера при сохранении файла"))
				return
			}

			// Генерируем уникальное имя файла
			filename := generateRandomFilename(fileHeader.Filename)

			// Полный путь к файлу
			filePath := filepath.Join(uploadDir, filename)

			// Создаем файл
			dst, err := os.Create(filePath)
			if err != nil {
				log.Error(op, "failed to create destination file", err)
				render.JSON(w, r, response.Error("Ошибка при создании файла"))
				return
			}
			defer dst.Close()

			// Копируем содержимое загруженного файла
			if _, err := io.Copy(dst, file); err != nil {
				log.Error(op, "failed to copy file content", err)
				render.JSON(w, r, response.Error("Ошибка при сохранении файла"))
				return
			}

			// Формируем URL для доступа к изображению и сохраняем его в DTO
			imageURL := fmt.Sprintf("/uploads/images/%s", filename)
			eventDto.ImageURL = imageURL
		}

		// Добавляем событие в базу данных
		id, err := eventStorage.AddEvent(eventDto)
		if err != nil {
			log.Error(op, "failed to add event", err)
			render.JSON(w, r, response.Error("Ошибка при добавлении события"))
			return
		}

		// Возвращаем успешный ответ с ID созданного события
		render.JSON(w, r, Response{Response: response.OK(), EventId: id})
	}
}

func GetEventsHandler(log *slog.Logger, eventStorage EventStorage, validate *validator.Validate) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.events.GetEvents"

		// Получаем параметры запроса для фильтрации
		title := r.URL.Query().Get("name")
		date := r.URL.Query().Get("date")
		address := r.URL.Query().Get("address")

		// Получаем отфильтрованные мероприятия
		events, err := eventStorage.GetFilteredEvents(title, date, address)
		if err != nil {
			log.Error(op, "failed to get filtered events", err)
			render.JSON(w, r, response.Error("failed to get events"))
			return
		}

		// Преобразуем события в формат EventCardProps
		eventCards := make([]storage.EventCardProps, 0, len(events))
		for _, event := range events {
			// Преобразуем дату в нужный формат
			dateStr := event.EventDate.Format("2006-01-02")

			// Здесь предполагается, что адрес находится в поле Description
			// Если у вас есть отдельное поле для адреса, используйте его
			address := event.EventAddress

			eventCards = append(eventCards, storage.EventCardProps{
				ID:      event.EventID,
				Name:    event.Title,
				Date:    dateStr,
				Address: address,
			})
		}

		render.JSON(w, r, Response{Response: response.OK(), EventCards: eventCards})
	}
}

func RegisterUserForEventHandler(log *slog.Logger, eventStorage EventStorage, validate *validator.Validate) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.events.RegisterUserForEvent"

		// Ограничиваем размер тела запроса
		r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

		// Декодируем JSON из тела запроса
		var req RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Error(op, "failed to decode request body", err)
			render.JSON(w, r, response.Error("Некорректный формат данных"))
			return
		}

		// Проверяем, что userId и eventId присутствуют
		if req.UserID == 0 || req.EventID == 0 {
			log.Error(op, "userId or eventId is missing in the request", nil)
			render.JSON(w, r, response.Error("userId и eventId должны быть указаны"))
			return
		}

		// Вызываем метод RegisterUserForEvent для регистрации пользователя
		err := eventStorage.RegisterUserForEvent(req.UserID, req.EventID)
		if err != nil {
			log.Error(op, "failed to register user for event", err)
			render.JSON(w, r, response.Error("не удалось зарегистрировать пользователя на мероприятие"))
			return
		}

		// Возвращаем успешный ответ с ID регистрации
		render.JSON(w, r, Response{Response: response.OK()})
	}
}

func AddUserHandler(log *slog.Logger, eventStorage EventStorage, validate *validator.Validate) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.events.AddUser"

		// Ограничиваем размер тела запроса
		r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

		// Декодируем JSON из тела запроса
		var req storage.CrateUserDto
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Error(op, "failed to decode request body", err)
			render.JSON(w, r, response.Error("Некорректный формат данных"))
			return
		}

		// Вызываем метод RegisterUserForEvent для регистрации пользователя
		id, err := eventStorage.AddUser(req)
		if err != nil {
			log.Error(op, "failed to register user for event", err)
			render.JSON(w, r, response.Error("не удалось зарегистрировать пользователя на мероприятие"))
			return
		}

		render.JSON(w, r, Response{Response: response.OK(), UserId: id})
	}
}

func GetProfileInfoHandler(log *slog.Logger, eventStorage EventStorage, validate *validator.Validate) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.events.GetProfileInfo"

		idStr := chi.URLParam(r, "id")

		idInt, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid event ID", http.StatusBadRequest)
			return
		}

		userInfo, err := eventStorage.GetUserInfo(idInt)
		if err != nil {
			log.Error(op, "failed to get user info", err)
			render.JSON(w, r, response.Error("не удалось получить информацию о пользователе"))
			return
		}

		events, err := eventStorage.GetEventsByUser(idInt)
		if err != nil {
			log.Error(op, "failed to get user events", err)
			render.JSON(w, r, response.Error("не удалось события пользователя"))
			return
		}

		render.JSON(w, r, Response{
			Response:    response.OK(),
			ProfileInfo: storage.ProfileInfo{User: userInfo, Events: events},
		})

	}
}

func Init(router *chi.Mux, log *slog.Logger, eventStorage EventStorage, validate *validator.Validate) {
	router.Post("/event", CreateEventHandler(log, eventStorage, validate))
	router.Get("/events", GetEventsHandler(log, eventStorage, validate))
	router.Post("/participate", RegisterUserForEventHandler(log, eventStorage, validate))
	router.Post("/register", AddUserHandler(log, eventStorage, validate))
	router.Get("/profile/{id}", GetProfileInfoHandler(log, eventStorage, validate))

	router.Handle("/uploads/images/*", http.StripPrefix("/uploads/images/", http.FileServer(http.Dir("./uploads/images"))))

}
