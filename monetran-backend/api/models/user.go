package models

import (
	"time"
)

// User represents a User model
type User struct {
	ID                uint       `gorm:"primary_key" json:"id"`
	FirstName         string     `json:"firstname"`
	LastName          string     `json:"lastname"`
	Email             string     `json:"email"`
	PhoneNumber       string     `json:"phone_number"`
	Password          string     `json:"-"`
	AccessToken       string     `json:"access_token"`
	AccountID         string     `json:"account_id"`
	MemoType          string     `json:"memo_text"`
	Memo              string     `json:"memo"`
	FederationAddress string     `json:"federation_address"`
	BankInfo          Bank       `gorm:"foreignKey:UserID" json:"bank_info"`
	ImageUrl          string     `json:"image_url"`
	Wallet            Wallet     `json:"wallets"`
	IsActive          bool       `json:"is_active"`
	IsAdmin           bool       `json:"is_admin"`
	Use2fA            bool       `json:"use_2fa"`
	KycVerified       bool       `json:"kyc_verified"`
	OAuthProvider     string     `json:"oauth_provider"`
	OAuthUID          string     `json:"oauth_uid"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
	DeletedAt         *time.Time `json:"deleted_at"`
}

// Bank represents bank info details in a User model
type Bank struct {
	ID            uint   `gorm:"primary_key" json:"id"`
	AccountName   string `json:"account_name"`
	AccountNumber string `json:"account_number"`
	BankName      string `json:"bank_name"`
	SortCode      string `json:"sort_code"`
	UserID        uint   `gorm:"foreignKey:UserID" json:"user_id"`
	BankAddress   string `json:"bank_address"`
}

// EmailVerification represents an email validating pair for a User
type EmailVerification struct {
	ID     uint   `gorm:"primary_key" json:"id"`
	Token  string `json:"token"`
	UserID uint   `gorm:"foreignKey:user_id" json:"user_id"`
}

// TrustDoc represents user submitted documents for kyc purposes
type TrustDoc struct {
	ID         uint      `gorm:"primary_key" json:"id"`
	FileName   string    `json:"filename"`
	UserID     uint      `gorm:"foreignKey:user_id" json:"user_id"`
	FirstName  string    `gorm:"-" json:"first_name"`
	LastName   string    `gorm:"-" json:"last_name"`
	IsVerified bool      `json:"is_verified"`
	Status     uint      `json:"status"`
	Type       string    `json:"type"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

var (
	KYC_UNVERIFIED uint = 0
	KYC_VERIFIED   uint = 1
	KYC_DECLINED   uint = 2
)

func (u *User) IsEmpty() bool {
	return u.ID == 0
}
