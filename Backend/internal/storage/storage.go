package storage

import "time"

type Event struct {
	EventID       int64     `json:"eventId"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	EventDate     time.Time `json:"eventDate"`
	EventAddress  string    `json:"eventAddress"`
	CreatorUserID int64     `json:"creatorUserId"`
	VKLink        string    `json:"vkLink"`
	TGLink        string    `json:"tgLink"`
	ImageURL      string    `json:"imageUrl"`
}

// EventCreateDto представляет собой DTO для создания события
type EventCreateDto struct {
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	EventDate     time.Time `json:"eventDate"`
	EventAddress  string    `json:"eventAddress"`
	CreatorUserID int64     `json:"creatorUserId"`
	VKLink        string    `json:"vkLink"`
	TGLink        string    `json:"tgLink"`
	ImageURL      string    `json:"imageUrl"`
}

type EventCardProps struct {
	ID      int64  `json:"id"`
	Name    string `json:"name"`
	Date    string `json:"date"`
	Address string `json:"address"`
}

type CrateUserDto struct {
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Pasword   string `json:"password"`
	ImageURL  string `json:"imageUrl"`
}

type UserInfo struct {
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

type ProfileInfo struct {
	User   UserInfo `json:"userInfo"`
	Events []Event  `json:"events"`
}
