CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL, 
    event_name VARCHAR(255) NOT NULL,
    event_time TIMESTAMP NOT NULL,
    notify_time TIMESTAMP NOT NULL );