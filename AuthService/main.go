package main

import (
	// "context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/cors"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-jwt/jwt/v5"
	_ "github.com/lib/pq"
	// "github.com/segmentio/kafka-go"
)

// User represents a user in the database
type User struct {
	ID       int    `json:"id"`
	Email    string `json:"email"`
	Password string `json:"password"` // Stored as hash
}

type UserRes struct {
	ID    int    `json:"id"`
	Email string `json:"email"` // Stored as hash
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// UserCreatedEvent represents the Kafka event for new user creation
type UserCreatedEvent struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// JWTResponse represents the JWT token response
type JWTResponse struct {
	Token   string  `json:"token"`
	Expires string  `json:"expires"`
	User    UserRes `json:"user"`
}

// Global variables
var (
	db          *sql.DB
	jwtSecret   = []byte(getEnvOrDefault("JWT_SECRET", "your-secret-key"))
	kafkaTopic  = getEnvOrDefault("KAFKA_TOPIC", "user-created")
	kafkaBroker = getEnvOrDefault("KAFKA_BROKER", "localhost:9092")
	dbConnStr   = getEnvOrDefault("DB_CONN_STR", "root:3392Mm!!@tcp(127.0.0.1:3306)/AuthDB?multiStatements=true&parseTime=true")
)

func main() {
	// Initialize database
	var err error
	db, err = sql.Open("mysql", dbConnStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Create users table if it doesn't exist
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL
		)
	`)
	if err != nil {
		log.Fatalf("Failed to create users table: %v", err)
	}

	// Start Kafka consumer in a goroutine
	// go consumeKafkaMessages()

	// Set up HTTP server with Chi router
	r := chi.NewRouter()
	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // В продакшене лучше указать конкретный домен, например, "http://localhost:3000"
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Максимальное время кэширования (в секундах) для preflight запросов
	})

	r.Use(corsMiddleware.Handler)

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Define routes
	r.Post("/login", handleLogin)

	// Start the server
	port := getEnvOrDefault("PORT", "8080")
	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// handleLogin handles user authentication and JWT token generation
func handleLogin(w http.ResponseWriter, r *http.Request) {
	var loginReq LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Check if user exists and password is correct
	user, err := authenticateUser(loginReq.Email, loginReq.Password)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Generate JWT token
	token, expiresAt, err := generateJWT(user)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Return JWT token
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(JWTResponse{
		Token:   token,
		Expires: expiresAt.Format(time.RFC3339),
		User:    UserRes{ID: user.ID, Email: user.Email},
	})
}

// authenticateUser checks if the email/password combination is valid
func authenticateUser(email, password string) (*User, error) {
	var user User
	var passwordHash string

	// Query the database for the user
	err := db.QueryRow("SELECT id, email, password_hash FROM users WHERE email = ?", email).Scan(
		&user.ID, &user.Email, &passwordHash,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	// Verify password
	if hashPassword(password) != passwordHash {
		return nil, errors.New("invalid password")
	}

	return &user, nil
}

// generateJWT creates a new JWT token for the authenticated user
func generateJWT(user *User) (string, time.Time, error) {
	expiresAt := time.Now().Add(24 * time.Hour)

	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     expiresAt.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expiresAt, nil
}

// consumeKafkaMessages listens for new user creation events from Kafka
// func consumeKafkaMessages() {
// 	// Configure Kafka reader
// 	reader := kafka.NewReader(kafka.ReaderConfig{
// 		Brokers:  []string{kafkaBroker},
// 		Topic:    kafkaTopic,
// 		GroupID:  "auth-service",
// 		MinBytes: 10e3,
// 		MaxBytes: 10e6,
// 	})
// 	defer reader.Close()

// 	log.Printf("Kafka consumer started on topic: %s", kafkaTopic)

// 	for {
// 		msg, err := reader.ReadMessage(context.Background())
// 		if err != nil {
// 			log.Printf("Error reading Kafka message: %v", err)
// 			continue
// 		}

// 		// Process the message
// 		var event UserCreatedEvent
// 		if err := json.Unmarshal(msg.Value, &event); err != nil {
// 			log.Printf("Error unmarshaling Kafka message: %v", err)
// 			continue
// 		}

// 		log.Printf("Received user creation event for: %s", event.Email)

// 		// Create user in database
// 		if err := createUser(event.Email, event.Password); err != nil {
// 			log.Printf("Error creating user: %v", err)
// 			continue
// 		}

// 		log.Printf("User created successfully: %s", event.Email)
// 	}
// }

// createUser adds a new user to the database with a hashed password
func createUser(email, password string) error {
	// Hash the password
	passwordHash := hashPassword(password)

	// Insert the user into the database
	_, err := db.Exec("INSERT INTO users (email, password_hash) VALUES (?, ?)", email, passwordHash)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

// hashPassword creates a SHA-256 hash of the password
// Note: In a production environment, use a more secure hashing algorithm like bcrypt
func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

// getEnvOrDefault returns the value of an environment variable or a default value
func getEnvOrDefault(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
