package wallet

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"

	safeCurrency "github.com/codehakase/monetran/api/utils/middleware"

	log "github.com/codehakase/monetran/api/logger"
	"github.com/codehakase/monetran/api/models"
	. "github.com/codehakase/monetran/api/models"
	"github.com/codehakase/monetran/api/utils"
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
	"github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/charge"
)

type ctxKey string

var (
	DB                  *gorm.DB
	ctxJwtClaims        = ctxKey("decoded")
	SupportedCurrencies = []string{"XLM", "MNDA"}
)

// SetState initializes runtime dependencies
func SetState(db *gorm.DB) {
	DB = db
}

// Activate a user wallet
func Activate(c *gin.Context) {
	var (
		data   map[string]string
		wallet Wallet
	)
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to activate wallet: %+v", err)
		utils.ErrException(c, "An error occurred while activating wallet", 400)
		return
	}
	err = json.NewDecoder(c.Request.Body).Decode(&data)
	if err != nil {
		log.Errorf("failed to decode data [w_activate]: %+v", err)
		utils.ErrException(c, "An error occurred while activating wallet", 400)
		return
	}
	err = DB.Where("id = ? AND user_id = ?", data["wallet_id"], user.ID).First(&wallet).Error
	if err != nil {
		log.Errorf("failed to fetch wallet: %+v", err)
		utils.ErrException(c, "An error occurred while activating wallet", 400)
		return
	}
	wallet.Activated = true
	DB.Save(&wallet)
	utils.SendResponse(c, wallet, fmt.Sprintf("%s Wallet activated successfully", wallet.Code), 200)
}

// TotalFunded retrieved the total amount funded to a user wallet
func TotalFunded(c *gin.Context) {
	type walletFunds struct {
		TotalFunded float64 `json:"total_funded"`
	}
	var (
		totalFunds walletFunds
	)
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to fetch wallet transactions: %+v", err)
		utils.ErrException(c, "An error occurred while fetching wallet transactions", 400)
		return
	}
	DB.Raw("SELECT SUM(amount) AS total_funded FROM wallet_transactions WHERE user_id = ? AND type = ?", user.ID, "Credit").Scan(&totalFunds)
	utils.SendResponse(c, totalFunds, "", 200)
}

// Fund tops up a user app wallet
func Fund(c *gin.Context) {

}

// UserWallets retrieves all wallets attached to user
func UserWallets(c *gin.Context) {
	var wallet Wallet
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to fetch wallets: %+v", err)
		utils.ErrException(c, "An error occurred while fetching wallets", 400)
		return
	}
	DB.Where("user_id = ?", user.ID).First(&wallet)
	formatted, err := safeCurrency.FormatPayload(wallet)
	if err != nil {
		utils.ErrException(c, "An error occurred while fetching user wallet", 400)
		return
	}
	utils.SendResponse(c, formatted, "", 200)
}

// Transactions retrieves wallet transactions for user
func Transactions(c *gin.Context) {
	var (
		transactions []WalletTransaction
		totalResults int
		currentPage  = 1
		offset       = 0
		limit        = 20
	)
	resp := make(map[string]interface{})
	currentPage, offset = utils.OffsetFromPage(c, limit, currentPage, offset)
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to fetch wallets: %+v", err)
		utils.ErrException(c, "An error occurred while fetching wallet transactions", 400)
		return
	}
	DB.Where("user_id = ?", user.ID).Find(&transactions).Count(&totalResults)
	DB.Raw("SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC OFFSET ? LIMIT ?", user.ID, offset, limit).Scan(&transactions)
	formatttedTransactions, err := safeCurrency.FormatPayload(transactions)
	if err != nil {
		utils.ErrException(c, "An error occurred while fetching wallet transactions", 400)
		return
	}
	resp["meta"] = map[string]interface{}{
		"total_results": totalResults,
		"current_page":  currentPage,
		"per_page":      limit,
	}
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"code":   http.StatusOK,
		"data":   formatttedTransactions,
		"meta":   resp["meta"],
	})
}

//RecentTransactions retrieves last 5 recent wallet transactions
func RecentTransactions(c *gin.Context) {
	var transactions []WalletTransaction
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to fetch wallets: %+v", err)
		utils.ErrException(c, "An error occurred while fetching wallet transactions", 400)
		return
	}
	DB.Raw("SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5", user.ID).Scan(&transactions)
	formatttedTransactions, err := safeCurrency.FormatPayload(transactions)
	if err != nil {
		utils.ErrException(c, "An error occurred while fetching wallet transactions", 400)
		return
	}
	utils.SendResponse(c, formatttedTransactions, "", http.StatusOK)
}

// GetAchTransfers retrieves all ach transactions made by a user
func GetAchTransfers(c *gin.Context) {
	var (
		achTransfers []models.ACHTransferRequest
		totalResults int
		currentPage  = 1
		offset       = 0
		limit        = 20
	)
	resp := make(map[string]interface{})
	currentPage, offset = utils.OffsetFromPage(c, limit, currentPage, offset)
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		utils.ErrException(c, "An error occurred while fetching wallet transactions", 400)
		return
	}
	DB.Where("user_id = ?", user.ID).Find(&achTransfers).Count(&totalResults)
	err = DB.Raw("SELECT * FROM ach_transfer_requests WHERE user_id = ? ORDER BY ach_transfer_requests.created_at DESC OFFSET ? LIMIT ?", user.ID, offset, limit).Scan(&achTransfers).Error
	if err != nil {
		log.Errorf("failed retrieve ach_transfers: %+v", err)
		utils.ErrException(c, "An error occurred while retrieving data", http.StatusNotFound)
		return
	}
	formattedTransfers, err := safeCurrency.FormatPayload(achTransfers)
	if err != nil {
		utils.ErrException(c, "An error occurred while fetching wallet transactions", 400)
		return
	}
	resp["meta"] = map[string]interface{}{
		"total_results": totalResults,
		"current_page":  currentPage,
		"per_page":      limit,
	}
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"code":   http.StatusOK,
		"data":   formattedTransfers,
		"meta":   resp["meta"],
	})
}

// Charge creates a Stripe charge, and charges a tokenized card
func Charge(c *gin.Context) {
	var (
		chargeReq StripeCharge
		wallet    Wallet
	)
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to charge user card: %+v", err)
		utils.ErrException(c, "An error occurred while charging your card, try again later", 400)
		return
	}
	err = json.NewDecoder(c.Request.Body).Decode(&chargeReq)
	if err != nil {
		log.Printf("failed to decode data [u_charge_card]: %+v", err)
		utils.ErrException(c, "An error occurred while charging card", 400)
		return
	}
	log.Printf("ch data: %+v", chargeReq)
	safeAmount := safeCurrency.ToMints(chargeReq.Amount).Int64()
	stripe.Key = os.Getenv("STRIPE_TEST_KEY")
	params := &stripe.ChargeParams{
		Amount:      stripe.Int64(int64(chargeReq.Amount * 100)),
		Currency:    stripe.String(string(stripe.CurrencyUSD)),
		Description: stripe.String(chargeReq.Description),
	}
	log.Printf("charge req: %+v\n", chargeReq)
	if err := params.SetSource(chargeReq.Token); err != nil {
		log.Errorf("failed to set charge source [u_charge_card]: %+v", err)
		utils.ErrException(c, "An error occurred while charging card", 400)
		return
	}
	ch, err := charge.New(params)
	if err != nil {
		log.Errorf("failed to charge source [u_charge_card]: %+v", err)
		utils.ErrException(c, "An error occurred while charging card", 400)
		return
	}
	if !ch.Paid {
		utils.ErrException(c, "An error occurred while charging card", 400)
	}
	log.Printf("charge successful: %+v", ch)
	// update user mnda wallet
	err = DB.Where("code = ? AND user_id = ?", "MNDA", user.ID).First(&wallet).Error
	if err != nil {
		log.Printf("failed to fetch wallet: %+v", err)
		utils.ErrException(c, "An error occurred while activating wallet", 400)
		return
	}
	wallet.Balance = wallet.Balance + safeAmount
	DB.Save(&wallet)
	walletTxt := &WalletTransaction{
		TransactionReference: strings.ToLower(utils.GenerateMemo()),
		Type:                 "Credit",
		WalletID:             wallet.ID,
		UserID:               user.ID,
		Amount:               safeAmount,
		Status:               1,
	}
	err = DB.Create(&walletTxt).Error
	if err != nil {
		log.Errorf("failed to create transfer event, err: %+v", err)
	}
	c.JSON(http.StatusCreated, gin.H{
		"status":        "ok",
		"amount_funded": ch.Amount,
	})
}

// GenerateACHPaymentReference generates a unique reference for a ACH transfer request
// TODO:
// Request Amount in payload
func GenerateACHPaymentReference(c *gin.Context) {
/*	
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		utils.ErrException(c, "User Account not authorized for this action", 400)
		return
	}
*/
	// confirm slug is part of supported currencies
	slug := c.Param("slug")
	if slug == "" {
		utils.ErrException(c, "Invalid wallet slug detected", 400)
		return
	}
	amount, _ := strconv.ParseFloat(c.Query("amount"), 64)
	log.Infof("param: %+v amount: %+v", c.Param("amount"), amount)
	if amount < 1 {
		utils.ErrException(c, "Invalid amount; amount should be greater than 1.", 400)
		return
	}
	if !utils.InStringSlice(SupportedCurrencies, slug) {
		utils.ErrException(c, "Invalid wallet slug detected", 400)
		return
	}
	reference := utils.GenerateMemo()

	// create ACHTransferRequest entry

/*	
	achTransferRequest := ACHTransferRequest{
		UserID:               user.ID,
		TransactionReference: reference,
		Amount:               safeCurrency.ToMints(amount).Int64(),
		Currency:             strings.ToUpper(slug),
	}
	err = DB.Create(&achTransferRequest).Error
	if err != nil {
		log.Errorf("ach DB error: %+v", err)
		utils.ErrException(c, "Unable to generate a trasaction ref at this time.", 400)
		return
	}
*/
	c.JSON(http.StatusCreated, gin.H{
		"status":    "success",
		"reference": reference,
	})
}

// SaveACHTransferRequest saves an ACH transfer request from a user awaiting processing from an admin
// TODO:
// Check KYC before saving entry
func SaveACHTransferRequest(c *gin.Context) {
	var (
		data       map[string]string
		achRequest ACHTransferRequest
	)
	err := json.NewDecoder(c.Request.Body).Decode(&data)
	if err != nil {
		log.Errorf("failed to decode data [ach_transfers.save_request]: %+v", err)
		utils.ErrException(c, "An error occurred while sending your request", 400)
		return
	}
			//|| data["achProof"] == "" 
	if data["achReference"] == "" {
		log.Errorf("failed to save achTxtRequest: data is empty %+v", data)
		utils.ErrException(c, "Please confirm you're sending a Transaction Reference and/or a Proof of Transfer", 400)
		return
	}
	tx := DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()
	if tx.Error != nil {
		return
	}
/*
	err = tx.Where("transaction_reference = ?", data["achReference"]).Find(&achRequest).Error
	if err != nil {
		log.Errorf("failed to retrieve ach_transfer_request: %+v", err)
		utils.ErrException(c, "Could not find ACH Transfer request with Memo", 400)
		tx.Rollback()
		return
	}
*/
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		utils.ErrException(c, "User Account not authorized for this action", 400)
		return
	}
	slug := "MNDA"
	if slug == "" {
		utils.ErrException(c, "Invalid wallet slug detected", 400)
		return
	}
	amount, _ := strconv.ParseFloat(data["amount"], 64)
	log.Infof("param: %+v amount: %+v", c.Param("amount"), amount)
	if amount < 1 {
		utils.ErrException(c, "Invalid amount; amount should be greater than 1.", 400)
		return
	}
	if !utils.InStringSlice(SupportedCurrencies, slug) {
		utils.ErrException(c, "Invalid wallet slug detected", 400)
		return
	}
	reference := data["achReference"]

	achRequest = ACHTransferRequest{
		UserID:               user.ID,
		TransactionReference: reference,
		Amount:               safeCurrency.ToMints(amount).Int64(),
		Currency:             strings.ToUpper(slug),
	}
	err = tx.Create(&achRequest).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("ach DB error: %+v", err)
		utils.ErrException(c, "Unable to generate a trasaction ref at this time.", 400)
		return
	}
/*
	achRequest.Proof = data["achProof"]
	err = tx.Save(&achRequest).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("failed to save ach_transfer_request: %+v", err)
		utils.ErrException(c, "An error occurred while sending your request", 400)
		return
	}
*/	
	tx.Commit()

/*
	var user User
	err = DB.Where("id = ?", achRequest.UserID).First(&user).Error
	if err != nil {
		log.Errorf("failed to save ach_transfer_request: %+v", err)
		utils.ErrException(c, "An error occurred while sending your request", 400)
		return
	}
*/
	go utils.SendGenericMail(user.Email, "ACH Transfer Request Received", "Hi there, we've received your ACH Transfer request, it'll be processed shortly.")
	go utils.SendGenericMail(os.Getenv("EMAIL_ADMIN"), "ACH Transfer Request Received", "Hi there, we've received your ACH Transfer request, it'll be processed shortly.")
	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "ACH Transfer Request sent, and will be processed shortly",
	})
}
