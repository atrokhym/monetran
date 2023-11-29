package models

import "github.com/jinzhu/gorm"

// Migrate runs a migration of all availalbe models
func Migrate(db *gorm.DB) {
	//db.DropTableIfExists("banks", "users", "wallets", "transfers", "wallet_transactions")
	db.AutoMigrate(
		&User{},
		&EmailVerification{},
		&Wallet{},
		&WalletTransaction{},
		&Bank{},
		&Transfer{},
		&P2PTransfer{},
		&AnchorWithdrawal{},
		&TransferRequest{},
		&Payment{},
		&TrustDoc{},
		&ACHTransferRequest{},
		&Config{},
		&Fee{},
	)
	db.Model(&Wallet{}).AddForeignKey("user_id", "users(id)", "RESTRICT", "RESTRICT")
	db.Model(&WalletTransaction{}).AddForeignKey("user_id", "users(id)", "RESTRICT", "RESTRICT")
	db.Model(&WalletTransaction{}).AddForeignKey("wallet_id", "wallets(id)", "RESTRICT", "RESTRICT")
	db.Model(&EmailVerification{}).AddForeignKey("user_id", "users(id)", "RESTRICT", "RESTRICT")

	db.Model(&Bank{}).AddForeignKey("user_id", "users(id)", "RESTRICT", "RESTRICT")
	db.Model(&Transfer{}).AddForeignKey("user_id", "users(id)", "RESTRICT", "RESTRICT")
	db.Model(&Transfer{}).AddForeignKey("wallet_id", "wallets(id)", "RESTRICT", "RESTRICT")
	db.Model(&P2PTransfer{}).AddForeignKey("user_id", "users(id)", "RESTRICT", "RESTRICT")
	db.Model(&AnchorWithdrawal{}).AddForeignKey("user_id", "users(id)", "RESTRICT", "RESTRICT")

	db.Model(&TransferRequest{}).AddForeignKey("transfer_id", "transfers(id)", "RESTRICT", "RESTRICT")
	db.Model(&Payment{}).AddForeignKey("user_id", "users(id)", "RESTRICT", "RESTRICT")
	db.Model(&TrustDoc{}).AddForeignKey("user_id", "users(id)", "RESTRICT", "RESTRICT")
	db.Model(&ACHTransferRequest{}).AddForeignKey("user_id", "users(id)", "RESTRICT", "RESTRICT")
	db.Model(&Fee{}).AddForeignKey("charged_to", "users(id)", "RESTRICT", "RESTRICT")
}
