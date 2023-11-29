package models

import (
	"time"
)

// Transfer represents a remittance transfer
type Transfer struct {
	ID               uint      `gorm:"primary_key" json:"id"`
	TransactionID    string    `json:"transaction_id"`
	UserID           uint      `gorm:"foreignKey:user_id" json:"user_id"`
	Type             string    `json:"type"`
	RecipientName    string    `json:"recipient_name"`
	Amount           int64     `json:"amount"`
	Currency         string    `json:"currency"`
	Fee              float64   `gorm:"default:0" json:"fee"`
	RecipientCountry string    `json:"recipient_country"`
	RecipientState   string    `json:"recipient_state"`
	RecipientPhone   string    `json:"recipient_phone"`
	BankName         string    `json:"bank_name"`
	AccountName      string    `json:"account_name"`
	AccountNumber    string    `json:"account_number"`
	SortCode         string    `json:"sort_code"`
	WalletID         uint      `json:"wallet_id"`
	Status           uint      `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// AnchorWithdrawal represents an anchor withdrawal
type AnchorWithdrawal struct {
	ID        uint      `gorm:"primary_key" json:"id"`
	UserID    uint      `gorm:"foreignKey:user_id" json:"user_id"`
	FirstName string    `gorm:"-" json:"first_name"`
	LastName  string    `gorm:"-" json:"last_name"`
	Currency  string    `json:"currency"`
	Amount    int64     `json:"amount"`
	Status    uint      `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TransferRequest represents a remittance transaction request in a DB queue
type TransferRequest struct {
	ID         uint      `gorm:"primary_key" json:"id"`
	TransferID uint      `json:"transfer_id"`
	Status     uint      `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

// P2PTransfer represents a p2p transaction between user and a recipient
type P2PTransfer struct {
	ID                     uint      `gorm:"primary_key" json:"id"`
	UserID                 uint      `json:"user_id"`
	RecipientWalletAddress string    `json:"recipient_wallet_address"`
	Amount                 int64     `json:"amount"`
	Currency               string    `json:"currency"`
	CreatedAt              time.Time `json:"created_at"`
}

func (P2PTransfer) TableName() string {
	return "p2p_transfers"
}

func (t *Transfer) CalculatedItem() int64 {
	return t.Amount
}

func (a *AnchorWithdrawal) CalculatedItem() int64 {
	return a.Amount
}

func (p *P2PTransfer) CalculatedItem() int64 {
	return p.Amount
}
