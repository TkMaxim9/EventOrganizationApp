package eventemail

import (
	"net/smtp"
)

func SendEventNotification(addresses []string, event string, date string) (bool, error) {
	// Конфигурация SMTP
	smtpHost := "smtp.gmail.com"
	smtpPort := "587"
	from := "m73754896@gmail.com"
	password := ""

	// Соединение с SMTP сервером
	auth := smtp.PlainAuth("", from, password, smtpHost)

	to := addresses
	fullMessageText := "Привет, " + event + " состоится уже " + date + " не забудь!!!"
	msg := []byte(fullMessageText)

	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, to, msg)
	if err != nil {
		return false, err
	}

	return true, nil
}
