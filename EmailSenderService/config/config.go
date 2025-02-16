package config

import (
	"EmailSenderService/internal/storage/mysql"
	"log"
)

var GlobalStorage *mysql.Storage

func InitStorage() {
	storagePath := "root:3392Mm!!@tcp(127.0.0.1:3306)/NotificationDB?multiStatements=true&parseTime=true"

	var err error
	GlobalStorage, err = mysql.New(storagePath)
	if err != nil {
		log.Fatalf("Failed to initialize storage: %v", err)
	}
}
