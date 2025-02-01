package events

import (
	"Backend/internal/lib/response"
	"Backend/internal/storage"
	"github.com/go-chi/chi"
	"github.com/go-chi/render"
	"github.com/go-playground/validator/v10"
	"log/slog"
	"net/http"
)

type Response struct {
	response.Response
	Events  []storage.Event `json:"events,omitempty"`
	EventId int64           `json:"eventId,omitempty"`
}

type CreateRequest struct {
	Event storage.EventCreateDto `json:"event" validate:"required,event"`
}

type EventStorage interface {
	AddEvent(dto storage.EventCreateDto) (int64, error)
	GetAllEvents() ([]storage.Event, error)
}

func eventValidator(fl validator.FieldLevel) bool {
	event, ok := fl.Field().Interface().(storage.EventCreateDto)
	if !ok {
		return false
	}

	return event.Title != ""
}

func CreateEvent(log *slog.Logger, eventStorage EventStorage, validate *validator.Validate) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.events.CreateEvent"

		var req CreateRequest

		err := render.DecodeJSON(r.Body, &req)
		if err != nil {
			log.Error(op, "failed to decode JSON body", err)

			render.JSON(w, r, response.Error("failed to decode request"))

			return
		}

		err = validate.Struct(req)
		if err != nil {
			log.Error(op, "validation failed", err)
			render.JSON(w, r, response.Error("validation error"))
			return
		}

		id, err := eventStorage.AddEvent(req.Event)
		if err != nil {
			log.Error(op, "failed to add event", err)

			render.JSON(w, r, response.Error("failed to add event"))

			return
		}

		render.JSON(w, r, Response{Response: response.OK(), EventId: id})

		return
	}
}

func GetEvents(log *slog.Logger, eventStorage EventStorage, validate *validator.Validate) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.events.GetEvents"

		events, err := eventStorage.GetAllEvents()
		if err != nil {
			log.Error(op, "failed to get events", err)

			render.JSON(w, r, response.Error("failed to get events"))

			return
		}

		render.JSON(w, r, Response{Response: response.OK(), Events: events})

		return
	}
}

func Init(router *chi.Mux, log *slog.Logger, eventStorage EventStorage, validate *validator.Validate) {
	router.Post("/event", CreateEvent(log, eventStorage, validate))
	router.Get("/events", GetEvents(log, eventStorage, validate))
}
