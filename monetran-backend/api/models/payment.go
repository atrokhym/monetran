package models

import "time"

// Payment represents a payment pulled from app wallet's transactions feeds
// It maps a transaction ID to a user via memo
type Payment struct {
	ID            uint      `gorm:"primary_key" json:"id"`
	TransactionID string    `json:"transacton_id"`
	UserID        uint      `gorm:"foreignKey:UserID" json:"user_id"`
	Memo          string    `json:"memo"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
