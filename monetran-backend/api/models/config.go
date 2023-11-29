package models

import (
	"time"

	"github.com/jinzhu/gorm"
)

// Config represents app wide configuration settings
type Config struct {
	ID        uint      `gorm:"primary_key" json:"id"`
	Type      string    `json:"type"`
	Label     string    `json:"label"`
	Value     string    `json:"value"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Fee represents a fee charged on the app
type Fee struct {
	ID            uint      `gorm:"primary_key" json:"id"`
	Type          string    `json:"type"`
	ChargedTo     uint      `gorm:"foreignKey:ChargedTo" json:"charged_to"`
	BaseAmount    int64     `json:"base_amount"`
	AmountCharged int64     `json:"amount_charged"`
	Currency      string    `json:"currency"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// WithType retrieves all configs pair for type
func WithType(configType string, DB *gorm.DB) []Config {
	var configs []Config
	DB.Where("type = ?", configType).Find(&configs)
	return configs
}

// ConfigExists checks if a config pair is already persisted
func ConfigExists(configType, label, value string, DB *gorm.DB) bool {
	var config Config
	err := DB.Where("type = ? AND label = ? AND value = ?", configType, label, value).First(&config).Error
	if err != nil && err == gorm.ErrRecordNotFound {
		return false
	}
	return config.ID > 0
}

// NewConfig creates a new settings config record
func NewConfig(DB *gorm.DB, configType, label, value string) (Config, error) {
	record := Config{
		Type:  configType,
		Label: label,
		Value: value,
	}
	err := DB.Create(&record).Error
	return record, err
}

// FeeTypes contains all fee types supported
var FeeTypes = map[string]string{
	"withdraw": "anchor_withdrawal",
	"deposit": "anchor_deposit",
}
