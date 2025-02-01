package validator

import (
	"Backend/internal/storage"
	"github.com/go-playground/validator/v10"
)

// eventValidator проверяет корректность структуры EventCreateDto
func eventValidator(fl validator.FieldLevel) bool {
	event, ok := fl.Field().Interface().(storage.EventCreateDto)
	if !ok {
		return false
	}

	return event.Title != ""
}

func RegisterCustomValidators(validate *validator.Validate) error {
	if err := validate.RegisterValidation("event", eventValidator); err != nil {
		return err
	}

	return nil
}
