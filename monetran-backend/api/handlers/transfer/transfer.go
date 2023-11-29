package transfer

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"math"

	log "github.com/codehakase/monetran/api/logger"
	. "github.com/codehakase/monetran/api/models"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/schema"
	"github.com/stellar/go/build"
	"github.com/stellar/go/clients/horizon"
	"github.com/stellar/go/keypair"
	"github.com/stellar/go/strkey"
	"golang.org/x/crypto/bcrypt"

	"github.com/codehakase/monetran/api/utils"
	safeCurrency "github.com/codehakase/monetran/api/utils/middleware"
	"github.com/jinzhu/gorm"
)

// DB represents the Database Handler
var DB *gorm.DB
var ubanks = map[string]string{
	"000014": "AccessBank",
	"000009": "CitiBank",
	"000005": "DiamondBank",
	"000010": "Ecobank",
	"000019": "EnterpriseBank",
	"000003": "FCMB",
	"000007": "FidelityBank",
	"000016": "FirstBank",
	"000013": "GTBank",
	"000020": "Heritage",
	"000002": "KeystoneBank",
	"000008": "SkyeBank",
	"000012": "Stanbic",
	"000021": "StandardChartered",
	"000001": "SterlingBank",
	"000004": "UBA",
	"000018": "UnionBank",
	"000011": "UnityBank",
	"000017": "WemaBank",
	"000015": "ZenithBank",
}

// SetState initializes runtime dependencies
func SetState(db *gorm.DB) {
	DB = db
}

// TotalTransfers retrieves the total transfers from user account
func TotalTransfers(c *gin.Context) {
	type transfer struct {
		TotalTransfers uint `json:"total_transfers"`
	}
	var totalTransfers transfer
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to fetch wallet transactions: %+v", err)
		utils.ErrException(c, "An error occurred while fetching transactions", 400)
		return
	}
	err = DB.Raw("SELECT COUNT(*) AS total_transfers FROM transfers WHERE user_id = ?", user.ID).Find(&totalTransfers).Error
	if err != nil {
		log.Errorf("failed to fetch transfers: %+v", err)
		utils.ErrException(c, "An error occurred while fetching transfers", 400)
		return
	}
	utils.SendResponse(c, totalTransfers, "", 200)
}

// TotalP2PTransfers retrieves the total p2p transactions made by user
func TotalP2PTransfers(c *gin.Context) {
	type transfer struct {
		TotalTransfers uint `json:"total_transfers"`
	}
	var totalTransfers transfer
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to fetch wallet transactions: %+v", err)
		utils.ErrException(c, "An error occurred while fetching transactions", 400)
		return
	}
	err = DB.Raw("SELECT COUNT(*) AS total_transfers FROM p2p_transfers WHERE user_id = ?", user.ID).Find(&totalTransfers).Error
	if err != nil {
		log.Errorf("failed to fetch transfers: %+v", err)
		utils.ErrException(c, "An error occurred while fetching transfers", 400)
		return
	}
	utils.SendResponse(c, totalTransfers, "", 200)
}

// GetTransfers retrieves all remittance transfers from user account
func GetTransfers(c *gin.Context) {
	var transfers []Transfer
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to fetch transfers: %+v", err)
		utils.ErrException(c, "An error occurred while fetching transactions", 400)
		return
	}
	DB.Where("user_id = ?", user.ID).Find(&transfers)
	formattedTransferData, err := safeCurrency.FormatPayload(transfers)
	if err != nil {
		utils.ErrException(c, "An error occurred while fetching transactions", 400)
		return
	}
	utils.SendResponse(c, formattedTransferData, "", 200)
}

// GetRecentTransfers retrieves the most recent remittance transfers from user account
func GetRecentTransfers(c *gin.Context) {
	var transfers []Transfer
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to fetch transfers: %+v", err)
		utils.ErrException(c, "An error occurred while fetching transactions", 400)
		return
	}
	DB.Where("user_id = ?", user.ID).Limit(5).Order("created_at DESC").Find(&transfers)
	formattedTransferData, err := safeCurrency.FormatPayload(transfers)
	if err != nil {
		utils.ErrException(c, "An error occurred while fetching transactions", 400)
		return
	}
	utils.SendResponse(c, formattedTransferData, "", 200)
}

// NewAnchorWithdrawal creates a new Anchor withdrawal request from user
func NewAnchorWithdrawal(c *gin.Context) {
	var (
		data struct {
			Amount        float64 `json:"amount"`
			Authorization string  `json:"authorization"`
			WalletID      uint    `json:"wallet_id"`
		}
		wallet Wallet
	)
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Printf("failed create anchor withdrawal: %+v", err)
		utils.ErrException(c, "An error occurred while creating anchor withdrawal", 400)
		return
	}
	err = json.NewDecoder(c.Request.Body).Decode(&data)
	if err != nil {
		log.Printf("failed create anchor withdrawal: %+v", err)
		utils.ErrException(c, "An error occurred while creating anchor withdrawal", 400)
		return
	}
	// validate password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(data.Authorization))
	if err != nil {
		utils.ErrException(c, "Invalid credentials sent", 401)
		return
	}
	tx := DB.Begin()
	// confirm user has bank account details set
	bank := Bank{}
	tx.Model(&user).Related(&bank)
	if bank.ID < 1 {
		log.Printf("failed create anchor withdrawal: user <%d> doesn't have a bank account set", user.ID)
		tx.Rollback()
		utils.ErrException(c, "Please add your bank account details before using Anchor withdrawal", 400)
		return
	}
	// fetch wallet
	err = tx.Where("id = ?", data.WalletID).First(&wallet).Error
	if err != nil {
		log.Printf("failed create anchor withdrawal: %+v", err)
		tx.Rollback()
		utils.ErrException(c, "An error occurred while creating anchor withdrawal", 400)
		return
	}
	amount := safeCurrency.ToMints(data.Amount).Int64()
	if wallet.Balance < amount || amount > wallet.Balance {
		tx.Rollback()
		utils.ErrException(c, "Insufficient wallet balance to satisfy transaction", 400)
		return
	}
	amountWithinRange := (data.Amount >= 2 && data.Amount <= 35000)
	if !amountWithinRange {
		tx.Rollback()
		utils.ErrException(c, "You can only withdraw between 2 and 35,000", 400)
		return
	}

	//fee := CalculateWithdrawalFee(data.Amount)
	// $ = (amount - fee) * exchange-rate
	withdrawAmount := amount // + fee
	if wallet.Balance < withdrawAmount {
		tx.Rollback()
		utils.ErrException(c, "Insufficient wallet balance to satisfy transaction", 400)
		return
	}
	wallet.Balance = (wallet.Balance - withdrawAmount)

	// not saving now! 
	// will remove money from wallet when withdraw would be approved
	// DB.Save(&wallet)

	// create request
	request := &AnchorWithdrawal{
		UserID:   user.ID,
		Currency: wallet.Code,
		Amount:   amount,
		Status:   0,
	}
	err = tx.Create(&request).Error
	if err != nil {
		log.Errorf("failed to create anchor withdraw request, err: %+v", err)
		tx.Rollback()
		utils.ErrException(c, "An error occurred while creating anchor withdraw request", 400)
		return
	}

/*
	// save fee deducted
	feeEntry := &Fee{
		Type:          FeeTypes["withdraw"],
		ChargedTo:     user.ID,
		BaseAmount:    amount,
		AmountCharged: fee,
		Currency:      request.Currency,
	}
	err = tx.Create(&feeEntry).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("failed to create fee_entry record: %+v", err)
		utils.ErrException(c, "An error occurred while creating anchor withdraw request", 400)
		return
	}
	// create wallet notification entry
	walletTxt := &WalletTransaction{
		TransactionReference: strings.ToLower(utils.GenerateMemo()),
		Type:                 "Debit",
		WalletID:             wallet.ID,
		UserID:               user.ID,
		Amount:               withdrawAmount,
		Status:               1,
	}
	err = tx.Create(&walletTxt).Error
	if err != nil {
		log.Errorf("failed to create anchor withdraw request, err: %+v", err)
		tx.Rollback()
		utils.ErrException(c, "An error occurred while creating anchor withdraw request", 400)
		return
	}
*/

	tx.Commit()
	go utils.DispatchAnchorRequestNotification(user.Email, request)
	go utils.DispatchAnchorRequestNotification(os.Getenv("EMAIL_ADMIN"), request)
	utils.SendResponse(c, request, "Anchor request created successfully, payments will be processed shortly.", 201)
}

// AnchorWithdrawals retrieves all anchor withdrawal requests from user
func AnchorWithdrawals(c *gin.Context) {
	var withdrawals []AnchorWithdrawal
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to fetch anchor withdrawals: %+v", err)
		utils.ErrException(c, "An error occurred while fetching anchor withdrawals", 400)
		return
	}
	DB.Where("user_id = ?", user.ID).Order("created_at DESC").Find(&withdrawals)
	formattedWithdrawals, err := safeCurrency.FormatPayload(withdrawals)
	if err != nil {
		utils.ErrException(c, "An error occurred while fetching anchor withdrawals", 400)
		return
	}
	utils.SendResponse(c, formattedWithdrawals, "", 200)
}

// GetWithdrawal retrieves a single withdrawal
func GetWithdrawal(c *gin.Context) {
	var withdrawal AnchorWithdrawal
	id := c.Param("id")
	if id == "" {
		utils.ErrException(c, "Withdrawal request not found.", http.StatusBadRequest)
		return
	}
	err := DB.Where("id = ?", id).First(&withdrawal).Error
	if err != nil {
		log.Errorf("failed to retrieve withdrawal request: %+v", err)
		utils.ErrException(c, "Withdrawal request not found.", http.StatusBadRequest)
		return
	}
	utils.SendResponse(c, withdrawal, "", http.StatusOK)
}

type transferData struct {
	Amount         float64 `json:"amount"`
	Currency       string  `json:"currency"`
	RecipientName  string  `json:"recipient_name"`
	RecipientPhone string  `json:"recipient_phone"`
	BankName       string  `json:"bank_name"`
	AccountName    string  `json:"account_name"`
	AccountNumber  string  `json:"account_number"`
	SortCode       string  `json:"sort_code"`
	WalletID       uint    `json:"wallet_id"`
	Country        string  `json:"country"`
}

// NewTransfer creates a new remittance transfer request
func NewTransfer(c *gin.Context) {
	var (
		data   transferData
		wallet Wallet
	)
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed create anchor withdrawal: %+v", err)
		utils.ErrException(c, "An error occurred while creating anchor withdrawal", 400)
		return
	}
	err = json.NewDecoder(c.Request.Body).Decode(&data)
	if err != nil {
		log.Errorf("failed create anchor withdrawal: %+v", err)
		utils.ErrException(c, "An error occurred while creating anchor withdrawal", 400)
		return
	}
	if transferDataEmpty(data) {
		log.Errorf("failed to create transfer request, request data sent incomplete")
		utils.ErrException(c, "An error occurred while creating transfer request. Please confirm all input fields are sent", 400)
		return
	}
	tx := DB.Begin()
	err = tx.Where("id = ?", data.WalletID).First(&wallet).Error
	if err != nil {
		log.Errorf("failed to create transfer request: %+v", err)
		tx.Rollback()
		utils.ErrException(c, "An error occurred while creating transfer request", 400)
		return
	}
	amount := safeCurrency.ToMints(data.Amount).Int64()
	if wallet.Balance < amount || amount > wallet.Balance {
		tx.Rollback()
		utils.ErrException(c, "Insufficient wallet balance to satisfy transaction", 400)
		return
	}
	// create transfer
	transfer := &Transfer{
		TransactionID:    strings.ToLower(utils.GenerateMemo()),
		UserID:           user.ID,
		RecipientName:    data.RecipientName,
		RecipientPhone:   data.RecipientPhone,
		Amount:           amount,
		Currency:         data.Currency,
		BankName:         data.BankName,
		AccountName:      data.AccountName,
		AccountNumber:    data.AccountNumber,
		SortCode:         data.SortCode,
		WalletID:         data.WalletID,
		RecipientCountry: data.Country,
	}
	err = tx.Create(&transfer).Error
	if err != nil {
		log.Errorf("failed to create transfer request, err: %+v", err)
		tx.Rollback()
		utils.ErrException(c, "An error occurred while creating transfer request", 400)
		return
	}
	// create transfer request queue entry
	request := &TransferRequest{
		TransferID: transfer.ID,
	}
	err = tx.Create(&request).Error
	if err != nil {
		log.Errorf("failed to create transfer request, err: %+v", err)
		tx.Rollback()
		utils.ErrException(c, "An error occurred while creating transfer request", 400)
		return
	}
	tx.Commit()
	go utils.DispatchTransferRequestNotification(DB, transfer)
	utils.SendResponse(c, transfer, "Transfer request sent successfully, and will be processed shortly", 201)
}

// GetP2PTransfers retrieves all p2p transactions initiated by user
func GetP2PTransfers(c *gin.Context) {
	var transfers []P2PTransfer
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		utils.ErrException(c, "An error occurred while creating transfer request", 400)
		return
	}
	err = DB.Raw("SELECT * FROM p2p_transfers WHERE user_id = ? ORDER BY created_at DESC", user.ID).Find(&transfers).Error
	if err != nil {
		log.Errorf("failed to retrieve p2p transfer history: %+v", err)
		utils.ErrException(c, "An error occurred while creating transfer request", 400)
		return
	}
	formattedTransfers, err := safeCurrency.FormatPayload(transfers)
	if err != nil {
		utils.ErrException(c, "An error occurred while creating transfer request", 400)
		return
	}
	utils.SendResponse(c, formattedTransfers, "", 200)
}

// NewP2PTransfer initiates a p2p transfer between user and external stellar
// wallet clients
func NewP2PTransfer(c *gin.Context) {
	var (
		data struct {
			RecipientAddress string  `json:"recipient_wallet_address"`
			Memo             string  `json:"memo"`
			Amount           float64 `json:"amount"`
			WalletID         uint    `json:"wallet_id"`
		}
		federationData *utils.FederationData
		memo           string
	)
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to process p2p transfer request: %+v", err)
		utils.ErrException(c, "An error occurred while creating anchor withdrawal", 400)
		return
	}
	err = json.NewDecoder(c.Request.Body).Decode(&data)
	if err != nil {
		log.Errorf("failed to process p2p transfer request: %+v", err)
		utils.ErrException(c, "An error occurred while creating transfer request", 400)
		return
	}
	// validate request data
	if data.RecipientAddress == "" || data.Amount < 1 || data.WalletID < 1 {
		utils.ErrException(c, "Incorrect transfer data sent, check fields are sent correctly", 400)
		return
	}
	memo = data.Memo
	walletAddress := data.RecipientAddress
	isWalletStr := (len(strings.Split(data.RecipientAddress, "*")) < 2)
	if !isWalletStr {
		federationData, err = utils.RetrieveFederationData(data.RecipientAddress)
		if err != nil {
			log.Error(err.Error())
			utils.ErrException(c, "An error occurred while creating anchor withdrawal", 400)
			return
		}
		log.Infof("Federation data: %+v", federationData)
		walletAddress = federationData.AccountID
		memo = federationData.Memo
	}
	// validate recipient wallet address
	if isWalletStr {
		_, err = strkey.Decode(strkey.VersionByteAccountID, walletAddress)
		if err != nil {
			utils.ErrException(c, "Invalid Wallet address passed for Recipient!", 400)
			return
		}
	}
	// confirm wallet can transfer requested amount
	wallet := Wallet{}
	tx := DB.Begin()
	err = tx.Where("id = ?", data.WalletID).First(&wallet).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("failed to create transfer request: %+v", err)
		utils.ErrException(c, "An error occurred while reaching requested wallet", 400)
		return
	}
	amount := safeCurrency.ToMints(data.Amount).Int64()
	if wallet.Balance < amount || amount > wallet.Balance {
		tx.Rollback()
		utils.ErrException(c, "Insufficient wallet balance to satisfy transaction", 400)
		return
	}
	// confirm recipient has trustline to token
	var client *horizon.Client
	var network build.Network
	if os.Getenv("ENV") == "dev" {
		client = horizon.DefaultTestNetClient
		network = build.TestNetwork
	} else if os.Getenv("ENV") == "prod" {
		client = horizon.DefaultPublicNetClient
		network = build.PublicNetwork
	}
	account, err := client.LoadAccount(walletAddress)
	if err != nil {
		switch e := err.(type) {
		case *horizon.Error:
			fmt.Println("err type=" + e.Problem.Type)
			fmt.Println("err detailed=" + e.Problem.Detail)
			fmt.Println("err extras=" + string(e.Problem.Extras["result_codes"]))
		}
		tx.Rollback()
		log.Errorf("error occurred while fetching account from horizon [P2P], %+v", err)
		utils.ErrException(c, "Invalid Wallet address passed for Recipient!", 400)
		return
	}
	var hasTrustline bool
	for _, balance := range account.Balances {
		if wallet.Code == "XLM" && balance.Type == "native" {
			hasTrustline = true
			continue
		} else if strings.ToLower(balance.Code) == strings.ToLower(wallet.Code) {
			hasTrustline = true
			break
		} else {
			hasTrustline = false
		}
	}
	if !hasTrustline {
		tx.Rollback()
		utils.ErrException(c, "Recipient cannot receive funds at this time, as they have no trustline to token selected!", 400)
		return
	}
	// build transaction
	_, err = keypair.Parse(os.Getenv("WALLET_SEC_KEY"))
	if err != nil {
		tx.Rollback()
		log.Errorf("Failed to parse app wallet: %+v", err)
		utils.ErrException(c, "An error occurred while reaching requested wallet", 400)
		return
	}
	var paymentOp build.PaymentBuilder
	sourceSeed := os.Getenv("WALLET_SEC_KEY")
	if wallet.Code == "XLM" {
		paymentOp = returnPaymentOp(true, data.Amount, wallet.Code, walletAddress)
	} else {
		paymentOp = returnPaymentOp(false, data.Amount, wallet.Code, walletAddress)
	}
	txt, err := build.Transaction(
		build.SourceAccount{AddressOrSeed: sourceSeed},
		network,
		build.AutoSequence{SequenceProvider: client},
		paymentOp,
		build.MemoText{Value: memo},
	)
	if err != nil {
		tx.Rollback()
		log.Errorf("failed to build p2p transaction: %+v", err)
		utils.ErrException(c, "An error occurred while reaching requested wallet", 400)
		return
	}
	txe, err := txt.Sign(sourceSeed)
	if err != nil {
		tx.Rollback()
		log.Errorf("failed to sign p2p transaction: %+v", err)
		utils.ErrException(c, "An error occurred while reaching requested wallet", 400)
		return
	}
	base64Hash, err := txe.Base64()
	if err != nil {
		tx.Rollback()
		log.Errorf("failed to hash p2p transaction envelope: %+v", err)
		utils.ErrException(c, "An error occurred while reaching requested wallet", 400)
		return
	}
	resp, err := client.SubmitTransaction(base64Hash)
	if err != nil {
		switch e := err.(type) {
		case *horizon.Error:
			fmt.Println("err type=" + e.Problem.Type)
			fmt.Println("err detailed=" + e.Problem.Detail)
			fmt.Println("err extras=" + string(e.Problem.Extras["result_codes"]))
		}
		tx.Rollback()
		log.Errorf("failed to submit p2p transaction envelope to horizon: %+v", err)
		utils.ErrException(c, "An error occurred while reaching requested wallet", 400)
		return
	}
	log.Infof("[P2PTransfer Complete]: %v%s successfully sent to %s\n\n hash: %v", data.Amount, wallet.Code, walletAddress, resp.TransactionSuccessToString())
	wallet.Balance = wallet.Balance - amount
	tx.Save(&wallet)
	// wallet transaction entry
	topup := &WalletTransaction{
		Amount:               amount,
		TransactionReference: resp.Hash,
		Type:                 "Debit",
		WalletID:             wallet.ID,
		UserID:               user.ID,
		Status:               1,
	}
	err = tx.Create(&topup).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("transaction not processed, failed to create wallet_transaction entry: %+v u: %v", err, user)
		return
	}
	// save p2p transfer entry
	transferEntry := P2PTransfer{
		Amount:                 amount,
		Currency:               wallet.Code,
		RecipientWalletAddress: data.RecipientAddress,
		UserID:                 user.ID,
	}
	err = tx.Create(&transferEntry).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("p2p transaction not processed, failed to create entry: %+v u: %v", err, user.ID)
		return
	}
	tx.Commit()
	utils.SendResponse(c, data, "P2P Transfer request sent successfully, and will be processed shortly", 201)
}

type transactionTxt struct {
	ID            string `schema:"id"`
	Amount        string `schema:"amount"`
	AssetCode     string `schema:"asset_code"`
	Memo          string `schema:"memo"`
	MemoType      string `schema:"memo_type"`
	TransactionID string `schema:"transaction_id"`
	Route         string `schema:"route"`
	Data          string `schema:"data"`
	From          string `schema:"from"`
	AssetIssuer   string `schema:"asset_issuer"`
}

// ReceiveTransaction receives new transaction data from bridge service
func ReceiveTransaction(c *gin.Context) {
	var (
		user    User
		wallet  Wallet
		payment Payment
	)
	data := new(transactionTxt)
	err := c.Request.ParseForm()
	if err != nil {
		log.Fatalf("failed to parse transaction %+v", err)
		return
	}
	decoder := schema.NewDecoder()
	err = decoder.Decode(data, c.Request.PostForm)
	if err != nil {
		log.Fatalf("failed to parse transaction %+v", err)
		return
	}
	tx := DB.Begin()
	// confirm transaction hasn't been processed
	tx.Where("transaction_id = ?", data.TransactionID).First(&payment)
	if payment.ID > 0 { // payment has been processed
		tx.Rollback()
		log.Errorf("Transaction has already been processed >> %+v", payment)
		return
	}
	// fetch user with memo
	tx.Where("memo = ?", data.Memo).First(&user)
	if user.ID == 0 { // user not found with memo
		tx.Rollback()
		log.Infof("transaction memo not matched with user %v", payment)
		return
	}
	// fund wallet
	if data.AssetCode == "" {
		data.AssetCode = "XLM"
	}
	err = tx.Where("code = ? AND user_id = ?", data.AssetCode, user.ID).First(&wallet).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("transaction not processed, user wallet not found: %+v u: %v", err, user)
		return
	}
	amount, _ := strconv.ParseFloat(data.Amount, 64)
	baseAmount := safeCurrency.ToMints(amount).Int64()
	wallet.Balance = (wallet.Balance + baseAmount)
	tx.Save(&wallet)
	// create wallet activity entry
	topup := &WalletTransaction{
		Amount:               baseAmount,
		TransactionReference: data.ID,
		Type:                 "Credit",
		WalletID:             wallet.ID,
		UserID:               user.ID,
		Status:               1,
	}
	err = tx.Create(&topup).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("transaction not processed, failed to create wallet_transaction entry: %+v u: %v", err, user)
		return
	}
	// create transaction record to track payment
	paymentTx := &Payment{
		TransactionID: data.TransactionID,
		Memo:          data.Memo,
		UserID:        user.ID,
	}
	err = tx.Create(&paymentTx).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("transaction not processed, failed to create payment entry: %+v u: %v", err, paymentTx)
		return
	}
	tx.Commit()
	go utils.DispatchUserWalletFunded(user, amount, data.AssetCode, "STELLAR BRIDGE")
	c.Writer.WriteHeader(200)
	log.Printf("User MEMO <%s> funded with %v", data.Memo, data.Amount)
	log.Println("")
}

// ToXLM retrieves the xlm equivalent of amount
func ToXLM(code string, amount float64) float64 {
	var data map[string]interface{}
	resp, err := http.Get("https://api.stellarterm.com/v1/ticker.json")
	if err != nil {
		log.Fatalf("failed to fetch stellarterm ticket data: %+v", err)
	}
	_ = json.NewDecoder(resp.Body).Decode(&data)
	assets := data["assets"].([]interface{})
	val := fetchToken(assets, "NGNT")
	return amount * val["price_XLM"].(float64)
}
func fetchToken(payload []interface{}, code string) map[string]interface{} {
	var token map[string]interface{}
	for _, v := range payload {
		if v.(map[string]interface{})["code"] == code {
			token = v.(map[string]interface{})
			break
		}
	}
	return token
}

func transferDataEmpty(data transferData) bool {
	if data.Amount < 1 ||
		data.RecipientPhone == "" ||
		data.RecipientName == "" ||
		data.BankName == "" ||
		data.Currency == "" ||
		data.SortCode == "" ||
		data.AccountName == "" ||
		data.AccountNumber == "" {
		return true
	}
	return false
}

func CalculateWithdrawalFee000(amount float64) int64 {
	var percentage float64
	if amount < 100 {
		percentage = math.Max(1, (amount / 100) * 1)
	} else if amount >= 100 && amount < 500 {
		percentage = (amount / 100) * 1
	} else if amount >= 500 && amount < 10000 {
		percentage = (amount / 100) * 0.5
	} else if amount >= 10000 && amount < 50000 {
		percentage = (amount / 100) * 0.25
	} else if amount >= 50000 {
		percentage = (amount / 100) * 0.1
	} else {
		percentage = math.Max(1, (amount / 100) * 1)
	}
	return safeCurrency.ToMints(percentage).Int64()
}

// absolute value of fee
func CalculateWithdrawalFee(amount float64) int64 {
	var percentage float64
	if amount <= 200 {
		percentage = 2
	} else if amount > 200 && amount <= 500 {
		percentage = (amount / 100) * 1
	} else if amount > 500 && amount <= 10000 {
		percentage = (5 + (((amount - 500) / 100) * .5))
	} else if amount > 10000 && amount <= 50000 {
		percentage = (52.5 + (((amount - 10000) / 100) * .25))
	} else if amount > 50000 {
		percentage = (152.5 + (((amount - 50000) / 100) * .1))
	} else {
		percentage = math.Max(2, (amount / 100) * 1)
	}
	return safeCurrency.ToMints(percentage).Int64()
}


func CalculateDepositFee(amount float64) int64 {
	var fee float64
	//safeAmountMNDA := (safeAmount * 0.999 - 0.50) / exRate
	fee = amount * 0.001 + 0.50
	return safeCurrency.ToMints(fee).Int64()
}

/*
func CalculateDepositFeeMoneda(amount float64) float64 {
	var fee float64
	//safeAmountMNDA := (safeAmount * 0.999 - 0.50) / exRate
	fee = amount * 0.001 + 0.50
	return fee
}
*/