package models

import (
	"time"
)

// CurrencyModel represents an interface for Models that stores Amount in MINT
// form
type CurrencyModel interface {
	CalculatedItem() int64
}

// Wallet represent a Wallet model
type Wallet struct {
	ID        uint       `gorm:"primary_key" json:"id"`
	Code      string     `json:"code"`
	Currency  string     `json:"currency"`
	Balance   int64      `json:"balance"`
	UserID    uint       `gorm:"foreignKey:user_id" json:"user_id"`
	Activated bool       `json:"activated"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at"`
}

// WalletTransaction represents a new wallet transaction
type WalletTransaction struct {
	ID                   uint      `gorm:"primary_key" json:"id"`
	TransactionReference string    `json:"transaction_reference"`
	Type                 string    `json:"type"`
	WalletID             uint      `json:"wallet_id"`
	UserID               uint      `json:"user_id"`
	Amount               int64     `json:"amount"`
	Status               uint      `json:"status"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

// StripeCharge represents a charge request to be processed on stripe
type StripeCharge struct {
	Token       string  `json:"token"`
	Amount      float64 `json:"amount"`
	Description string  `json:"description"`
}

// ACHTransferRequest represents an ACH transfer request to be processed
type ACHTransferRequest struct {
	ID                   uint      `gorm:"primary_key" json:"id"`
	UserID               uint      `json:"user_id"`
	FirstName            string    `gorm:"-" json:"first_name"`
	LastName             string    `gorm:"-" json:"last_name"`
	TransactionReference string    `json:"transaction_reference"`
	Amount               int64     `json:"amount"`
	Currency             string    `json:"currency"`
	Proof                string    `json:"proof"`
	Status               uint      `json:"status"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

// ACH specific statuses
var (
	ACH_PENDING   uint = 0
	ACH_PROCESSED uint = 1
	ACH_DECLINED  uint = 2
)

// ToCurrency is a placeholder to allow this model statisfy the CurrencyModel
// interface
func (w *Wallet) CalculatedItem() int64 {
	return w.Balance
}

func (wt *WalletTransaction) CalculatedItem() int64 {
	return wt.Amount
}

func (a *ACHTransferRequest) CalculatedItem() int64 {
	return a.Amount
}
