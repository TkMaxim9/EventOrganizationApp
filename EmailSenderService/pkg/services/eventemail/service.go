package eventemail

import (
	"crypto/tls"
	"fmt"
	"net/smtp"
)

func SendEventNotification(address string, event string, date string) (bool, error) {
	// Конфигурация SMTP
	smtpHost := "smtp.yandex.ru"
	smtpPort := "465"
	from := "mx.tkachenk@yandex.ru"
	password := "wsoewdncbyqpcpka"

	// Настройка соединения с TLS
	tlsConfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         smtpHost,
	}

	// Установление соединения с сервером
	conn, err := tls.Dial("tcp", smtpHost+":"+smtpPort, tlsConfig)
	if err != nil {
		return false, fmt.Errorf("failed to connect to SMTP server: %v", err)
	}
	defer conn.Close()

	// Создание клиента SMTP поверх TLS
	client, err := smtp.NewClient(conn, smtpHost)
	if err != nil {
		return false, fmt.Errorf("failed to create SMTP client: %v", err)
	}

	// Аутентификация
	auth := smtp.PlainAuth("", from, password, smtpHost)
	if err := client.Auth(auth); err != nil {
		return false, fmt.Errorf("authentication failed: %v", err)
	}

	// Установка адреса отправителя
	if err := client.Mail(from); err != nil {
		return false, fmt.Errorf("failed to set sender: %v", err)
	}

	// Установка адресата
	if err := client.Rcpt(address); err != nil {
		return false, fmt.Errorf("failed to set recipient: %v", err)
	}

	// Отправка сообщения
	w, err := client.Data()
	if err != nil {
		return false, fmt.Errorf("failed to start data transfer: %v", err)
	}

	fullMessageText := "Subject: Уведомление о событии\r\n" +
		"Content-Type: text/plain; charset=\"utf-8\"\r\n\r\n" +
		"Привет, " + event + " состоится уже " + date + " не забудь!!!"

	if _, err := w.Write([]byte(fullMessageText)); err != nil {
		return false, fmt.Errorf("failed to write message: %v", err)
	}

	if err := w.Close(); err != nil {
		return false, fmt.Errorf("failed to close message writer: %v", err)
	}

	// Завершение сессии
	if err := client.Quit(); err != nil {
		return false, fmt.Errorf("failed to close connection: %v", err)
	}

	return true, nil
}
