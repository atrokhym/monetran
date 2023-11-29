package admin

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"

	log "github.com/codehakase/monetran/api/logger"
	"github.com/codehakase/monetran/api/models"
	"github.com/codehakase/monetran/api/services"
	"github.com/codehakase/monetran/api/utils"
	"github.com/codehakase/monetran/api/handlers/transfer"
	safeCurrency "github.com/codehakase/monetran/api/utils/middleware"
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
	"golang.org/x/crypto/bcrypt"
)

var (
	DB                *gorm.DB
	emptyString       string
	overviewLimit     = 3
	achTransferMedium = "ACH TRANSFER"
)

// SetState initializes runtime dependencies
func SetState(db *gorm.DB) {
	DB = db
	// create default admin account
	var admin models.User
	err := DB.Where("email =?", "admin@monetran.com").Find(&admin).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		log.Errorf("failed to create default admin account: %+v", err)
	}
	if err == gorm.ErrRecordNotFound {
		// create admin account
		admin.FirstName = "Monetran"
		admin.LastName = "Admin"
		password, err := bcrypt.GenerateFromPassword([]byte(os.Getenv("API_SECRET")), 10)
		if err != nil {
			log.Errorf("failed to create admin password: %+v", err)
			return
		}
		admin.Password = string(password)
		admin.IsActive = true
		admin.IsAdmin = true
		admin.Email = "admin@monetran.com"
		DB.Create(&admin)
	}
	if err := services.InitializeUnits(); err != nil {
		log.Errorf(err.Error())
	}
}

// RecentACHTransferRequests retrieves recent ACH transfer requests
func RecentACHTransferRequests(c *gin.Context) {
	var achTransfers []models.ACHTransferRequest

	err := DB.Raw("SELECT ach_transfer_requests.*, users.first_name, users.last_name FROM ach_transfer_requests INNER JOIN users users ON user_id = users.id WHERE ach_transfer_requests.status = ? LIMIT ?", models.ACH_PENDING, overviewLimit).Scan(&achTransfers).Error
	if err != nil {
		log.Errorf("failed retrieve recent_ach_transfers: %+v", err)
		utils.ErrException(c, "An error occurred while retrieving data", http.StatusNotFound)
		return
	}
	formatted, err := safeCurrency.FormatPayload(achTransfers)
	if err != nil {
		utils.ErrException(c, "An error occurred while retrieving data", http.StatusNotFound)
		return
	}
	utils.SendResponse(c, formatted, emptyString, http.StatusOK)
}

// RecentKYCUploads retrieves recent kyc uploads
func RecentKYCUploads(c *gin.Context) {
	var kycUploads []models.TrustDoc
	err := DB.Raw("SELECT trust_docs.*, users.first_name, users.last_name FROM trust_docs INNER JOIN users users ON user_id= users.id WHERE is_verified = ? LIMIT ?", false, overviewLimit).Scan(&kycUploads).Error
	if err != nil {
		log.Errorf("failed retrieve recent_kyc_uploads: %+v", err)
		utils.ErrException(c, "An error occurred while retrieving data", http.StatusNotFound)
		return
	}
	utils.SendResponse(c, kycUploads, emptyString, http.StatusOK)
}

// RecentTransactions retrieves recent transactions
func RecentTransactions(c *gin.Context) {}

// RecentP2PTransfers retrieves recent p2p transfer requests
func RecentP2PTransfers(c *gin.Context) {}

// RecentWithdrawals retrieves recent withdrawal requests
func RecentWithdrawals(c *gin.Context) {
	var withdrawals []models.AnchorWithdrawal

	err := DB.Raw("SELECT anchor_withdrawals.*, users.first_name, users.last_name FROM anchor_withdrawals INNER JOIN users users ON user_id = users.id WHERE anchor_withdrawals.status = ? LIMIT ?", models.ACH_PENDING, overviewLimit).Scan(&withdrawals).Error
	if err != nil {
		log.Errorf("failed retrieve a+withdrawals: %+v", err)
		utils.ErrException(c, "An error occurred while retrieving data", http.StatusNotFound)
		return
	}
	formatted, err := safeCurrency.FormatPayload(withdrawals)
	if err != nil {
		utils.ErrException(c, "An error occurred while retrieving data", http.StatusNotFound)
		return
	}
	utils.SendResponse(c, formatted, emptyString, http.StatusOK)
}

// GetACHTransfers retrieves recent ACH transfer requests
func GetACHTransfers(c *gin.Context) {
	var achTransfers []models.ACHTransferRequest
	err := DB.Raw("SELECT ach_transfer_requests.*, users.first_name, users.last_name FROM ach_transfer_requests INNER JOIN users users ON user_id = users.id ORDER BY ach_transfer_requests.status ASC, ach_transfer_requests.updated_at DESC").Scan(&achTransfers).Error
	if err != nil {
		log.Errorf("failed retrieve recent_ach_transfers: %+v", err)
		utils.ErrException(c, "An error occurred while retrieving data", http.StatusNotFound)
		return
	}
	formatted, err := safeCurrency.FormatPayload(achTransfers)
	if err != nil {
		utils.ErrException(c, "An error occurred while retrieving data", http.StatusNotFound)
		return
	}
	utils.SendResponse(c, formatted, emptyString, http.StatusOK)
}

// GetACHTransfer retrieves an ACH transfer request
func GetACHTransfer(c *gin.Context) {
	var achTransfer models.ACHTransferRequest
	id := c.Param("id")
	if id == "" {
		utils.ErrException(c, "ACH Transfer Request not found", http.StatusNotFound)
		return
	}
	err := DB.Raw("SELECT ach_transfer_requests.*, users.first_name, users.last_name FROM ach_transfer_requests INNER JOIN users users ON user_id = users.id WHERE ach_transfer_requests.id = ?", id).Scan(&achTransfer).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		log.Errorf("failed to retrieve ach_request: %+v", err)
		utils.ErrException(c, "ACH Transfer Request not found", http.StatusNotFound)
		return
	}
	formatted, err := safeCurrency.FormatPayload(achTransfer)
	if err != nil {
		utils.ErrException(c, "An error occurred while retrieving data", http.StatusNotFound)
		return
	}
	utils.SendResponse(c, formatted, emptyString, http.StatusOK)
}

// CreditACHUser approves an ACH request and funds user account with transferred amount
func CreditACHUser(c *gin.Context) {
	var (
		achTransfer models.ACHTransferRequest
		user        models.User
		wallet      models.Wallet
	)
	transferID := c.Param("id")
	// retrieve ach transfer
	err := DB.Where("id = ? AND status = ?", transferID, models.ACH_PENDING).Find(&achTransfer).Error
	if err != nil {
		log.Errorf("failed to retrieve ach_transfer: %+v", err)
		utils.ErrException(c, "Invalid ACH Transfer", http.StatusBadRequest)
		return
	}
	// get attached user wallet
	err = DB.Where("code = ? AND user_id = ?", achTransfer.Currency, achTransfer.UserID).Find(&wallet).Error
	if err != nil {
		log.Errorf("failed to retrieve ach_transfer: %+v", err)
		utils.ErrException(c, "Invalid ACH Transfer", http.StatusBadRequest)
		return
	}
	// retrieve mnda rate config
	var config models.Config
	err = DB.Where("type = ? AND label = ?", "bank", "ex_rate").Find(&config).Error
	if err != nil {
		log.Errorf("failed to retrieve config ext_rate: %+v", err)
		utils.ErrException(c, "Cannot process ACH Transfer at this time", http.StatusBadRequest)
		return
	}


	tx := DB.Begin()

	err = tx.Model(&achTransfer).Related(&user).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("failed to read achTransfer: %+v", err)
		utils.ErrException(c, "Cannot process ACH Transfer at this time", http.StatusBadRequest)
		return
	}

	exRate, _ := strconv.ParseFloat(config.Value, 64)
	// calculate in floats
	safeAmount := safeCurrency.MNDA(achTransfer.Amount).Moneda()

	fee := transfer.CalculateDepositFee(safeAmount)
	feeAmount := safeCurrency.MNDA(fee).Moneda()

	//safeAmountMNDA := (safeAmount * 0.999 - 0.50) / exRate
	safeAmountMNDA := (safeAmount - feeAmount) / exRate
	amount := safeCurrency.ToMints(safeAmountMNDA).Int64()
	// update user wallet with funded value
	wallet.Balance = wallet.Balance + amount
	achTransfer.Status = models.ACH_PROCESSED

	err = tx.Save(&wallet).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("failed to save wallet_txt: %+v", err)
		utils.ErrException(c, "Cannot process ACH Transfer at this time", http.StatusBadRequest)
		return
	}

	err = tx.Save(&achTransfer).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("failed to save achTransfer: %+v", err)
		utils.ErrException(c, "Cannot process ACH Transfer at this time", http.StatusBadRequest)
		return
	}

	walletTxt := &models.WalletTransaction{
		TransactionReference: strings.ToLower(utils.GenerateMemo()),
		Type:                 "Credit",
		WalletID:             wallet.ID,
		UserID:               wallet.UserID,
		Amount:               amount,
		Status:               1,
	}
	err = tx.Create(&walletTxt).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("failed to save wallet_txt: %+v", err)
		utils.ErrException(c, "Cannot process ACH Transfer at this time", http.StatusBadRequest)
		return
	}

	// save fee deducted
	feeEntry := &models.Fee{
		Type:          models.FeeTypes["deposit"],
		ChargedTo:     wallet.UserID,
		BaseAmount:    achTransfer.Amount,
		AmountCharged: fee,
		Currency:      achTransfer.Currency,
	}
	err = tx.Create(&feeEntry).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("failed to create fee_entry record: %+v", err)
		utils.ErrException(c, "An error occurred while approving anchor deposit request", 400)
		return
	}

	//go func() {
		err = services.DistributionToAppWallet(safeCurrency.MNDA(amount).Moneda(), achTransfer.Currency, fmt.Sprintf("MONETRAN_ACH_TRANSFER_%d", user.ID))
		if err != nil {
			tx.Rollback()
			log.Errorf(err.Error())
		}
	//}()

	tx.Commit()

	go utils.DispatchUserWalletFunded(user, safeCurrency.MNDA(amount).Moneda(), wallet.Code, achTransferMedium)

	utils.SendResponse(c, nil, "ACH Transfer completed", http.StatusOK)
}

// DeclineACHRequest declines an ACH request
func DeclineACHRequest(c *gin.Context) {
	var (
		data    map[string]string
		request models.ACHTransferRequest
		user    models.User
	)
	reqid := c.Param("id")
	_ = json.NewDecoder(c.Request.Body).Decode(&data)
	err := DB.Where("id = ? AND status = ?", reqid, models.ACH_PENDING).Find(&request).Error
	if err != nil {
		log.Errorf("failed to retrieve ach_transfer: %+v", err)
		utils.ErrException(c, "Invalid ACH Transfer", http.StatusBadRequest)
		return
	}
	DB.Model(&request).Related(&user)
	request.Status = models.ACH_DECLINED
	DB.Save(&request)
	go utils.SendGenericMail(user.Email, "ACH Request Declined", fmt.Sprintf("ACH Transfer Request has been declined. Here's what an admin wrote: %s", data["reason"]))
	utils.SendResponse(c, request, "ACH Request declined", http.StatusOK)
}

// ApproveKYC approves a KYC document uploaded by user
func ApproveKYC(c *gin.Context) {
	var (
		doc  models.TrustDoc
		kycUploads []models.TrustDoc
		user models.User
	)
	docID := c.Param("id")
	err := DB.Where("id = ? AND is_verified = ?", docID, false).Find(&doc).Error
	if err != nil {
		log.Errorf("failed to retrieve trust_doc: %+v", err)
		utils.ErrException(c, "Invalid KYC Document", http.StatusBadRequest)
		return
	}
	DB.Model(&doc).Related(&user)
	doc.IsVerified = true
	doc.Status = models.KYC_VERIFIED
	DB.Save(&doc)


	result := DB.Raw("SELECT trust_docs.* FROM trust_docs WHERE user_id = ? AND type in ('govtid', 'utilityBill') AND is_verified = ? and status = ?", user.ID, true, 1).Scan(&kycUploads)
	if result.Error != nil {
		log.Errorf("failed to retrieve trust_doc: %+v", result.Error)
		utils.ErrException(c, "Invalid KYC Document", http.StatusBadRequest)
		return
	}
	if result.RowsAffected >= 2 {
		log.Infof("user '%d' got all KYC docs approved\n", user.ID)
		user.KycVerified = true
		DB.Save(&user)
	}

	go utils.SendGenericMail(user.Email, "KYC Doc of type '" + doc.Type + "' has been verified", "The KYC Doc uploaded has been verified")
	utils.SendResponse(c, nil, "KYC Doc approved successfully", http.StatusOK)
}

func DeclineKYC(c *gin.Context) {
	var (
		data    map[string]string
		doc  models.TrustDoc
		user models.User
	)
	docID := c.Param("id")
	_ = json.NewDecoder(c.Request.Body).Decode(&data)

	err := DB.Where("id = ? AND is_verified = ?", docID, false).Find(&doc).Error
	if err != nil {
		log.Errorf("failed to retrieve trust_doc: %+v", err)
		utils.ErrException(c, "Invalid KYC Document", http.StatusBadRequest)
		return
	}
	DB.Model(&doc).Related(&user)
	doc.IsVerified = true
	doc.Status = models.KYC_DECLINED
	DB.Save(&doc)
	go utils.SendGenericMail(user.Email, "KYC Doc of type '" + doc.Type + "' was Declined", fmt.Sprintf("The KYC Doc uploaded was declined. Here's what an admin wrote: %s", data["reason"]))
	utils.SendResponse(c, nil, "KYC Doc has been declined", http.StatusOK)
}

func KYCDocs(c *gin.Context) {
	var kycUploads []models.TrustDoc
	err := DB.Raw("SELECT trust_docs.*, users.first_name, users.last_name FROM trust_docs INNER JOIN users users ON user_id= users.id").Scan(&kycUploads).Error
	if err != nil {
		log.Errorf("failed retrieve kyc_uploads: %+v", err)
		utils.ErrException(c, "An error occurred while retrieving data", http.StatusNotFound)
		return
	}
	utils.SendResponse(c, kycUploads, emptyString, http.StatusOK)
}

func Withdrawals(c *gin.Context) {
	var withdrawals []models.AnchorWithdrawal
	err := DB.Raw("SELECT anchor_withdrawals.*, users.first_name, users.last_name FROM anchor_withdrawals INNER JOIN users users ON user_id= users.id ORDER BY created_at DESC").Scan(&withdrawals).Error
	if err != nil {
		log.Errorf("failed retrieve withdrawals: %+v", err)
		utils.ErrException(c, "An error occurred while retrieving data", http.StatusNotFound)
		return
	}
	formatted, err := safeCurrency.FormatPayload(withdrawals)
	if err != nil {
		log.Errorf("failed retrieve withdrawals: %+v", err)
		utils.ErrException(c, "An error occurred while retrieving data", http.StatusNotFound)
		return
	}
	utils.SendResponse(c, formatted, emptyString, http.StatusOK)
}

// GetWithdrawal retrieves a single withdrawal request
func GetWithdrawal(c *gin.Context) {
	var withdrawal models.AnchorWithdrawal
	id := c.Param("id")
	if id == "" {
		utils.ErrException(c, "Withdrawal Request not found", http.StatusNotFound)
		return
	}
	err := DB.Raw("SELECT anchor_withdrawals.*, users.first_name, users.last_name FROM anchor_withdrawals INNER JOIN users users ON user_id = users.id WHERE anchor_withdrawals.id = ?", id).Scan(&withdrawal).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		log.Errorf("failed to retrieve anchor_withdrawal_request: %+v", err)
		utils.ErrException(c, "Withdrawal Request not found", http.StatusNotFound)
		return
	}
	formatted, err := safeCurrency.FormatPayload(withdrawal)
	if err != nil {
		log.Errorf("failed retrieve withdrawals: %+v", err)
		utils.ErrException(c, "An error occurred while retrieving data", http.StatusNotFound)
		return
	}
	utils.SendResponse(c, formatted, emptyString, http.StatusOK)
}

// ApproveWithdrawal request
func ApproveWithdrawal(c *gin.Context) {
	var (
		withdrawal models.AnchorWithdrawal
		user       models.User
		wallet 	   models.Wallet
	)
	id := c.Param("id")
	err := DB.Where("id = ?", id).First(&withdrawal).Error
	if err != nil {
		log.Errorf("failed to retrieve withdrawal request, %+v", err)
		utils.ErrException(c, "Withdrawal request not found", http.StatusBadRequest)
		return
	}
	err = DB.Where("id = ?", withdrawal.UserID).First(&user).Error
	if err != nil {
		log.Errorf("failed to retrieve withdrawal user, %+v", err)
		utils.ErrException(c, "Withdrawal request not found", http.StatusBadRequest)
		return
	}

	tx := DB.Begin()

	withdrawal.Status = 1
	//DB.Save(&withdrawal)
	err = tx.Save(&withdrawal).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("failed to save record: %+v", err)
		utils.ErrException(c, "An error occurred while approving anchor withdraw request", 400)
		return
	}

	amount_mnda := safeCurrency.MNDA(withdrawal.Amount).Moneda()

	// fetch wallet
	//wallet := Wallet{}
	err = tx.Model(&user).Related(&wallet).Error
	//err = tx.Where("id = ?", data.WalletID).First(&wallet).Error
	if err != nil {
		log.Printf("failed approve anchor withdrawal: %+v", err)
		tx.Rollback()
		utils.ErrException(c, "An error occurred while approving anchor withdrawal", 400)
		return
	}
	amount := withdrawal.Amount
	//amount := safeCurrency.ToMints(data.Amount).Int64()
	if wallet.Balance < amount || amount > wallet.Balance {
		tx.Rollback()
		utils.ErrException(c, "Insufficient wallet balance to satisfy transaction", 400)
		return
	}
	amountWithinRange := (amount_mnda >= 2 && amount_mnda <= 35000)
	if !amountWithinRange {
		tx.Rollback()
		utils.ErrException(c, "You can only withdraw between 2 and 35,000", 400)
		return
	}
	fee := transfer.CalculateWithdrawalFee(amount_mnda)

	// $ = (amount - fee) * exchange-rate
	withdrawAmount := amount // + fee

	if wallet.Balance < withdrawAmount {
		tx.Rollback()
		utils.ErrException(c, "Insufficient wallet balance to satisfy transaction", 400)
		return
	}
	wallet.Balance = (wallet.Balance - withdrawAmount)

	//DB.Save(&wallet)
	err = tx.Save(&wallet).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("failed to save record: %+v", err)
		utils.ErrException(c, "An error occurred while approving anchor withdraw request", 400)
		return
	}

	// save fee deducted
	feeEntry := &models.Fee{
		Type:          models.FeeTypes["withdraw"],
		ChargedTo:     user.ID,
		BaseAmount:    amount,
		AmountCharged: fee,
		Currency:      withdrawal.Currency,
	}
	err = tx.Create(&feeEntry).Error
	if err != nil {
		tx.Rollback()
		log.Errorf("failed to create fee_entry record: %+v", err)
		utils.ErrException(c, "An error occurred while approving anchor withdraw request", 400)
		return
	}
	// create wallet notification entry
	walletTxt := &models.WalletTransaction{
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
		utils.ErrException(c, "An error occurred while approving anchor withdraw request", 400)
		return
	}


	//go 
	//func() {
		err = services.AppToDistributionWallet(amount_mnda, withdrawal.Currency, fmt.Sprintf("MONETRAN_WITHDRAWAL_%d", user.ID))
		if err != nil {
			tx.Rollback()
			utils.ErrException(c, "An error occurred while approving anchor withdraw request", 400)
			log.Errorf(err.Error())
			return
		}
	//}()

	tx.Commit()

	go utils.SendGenericMail(user.Email, "Withdrawal Request Approved", fmt.Sprintf("Your withdrawal request of %2f %s has been approved. You will receive the amount in the bank configured to your Monetran account.", amount_mnda, withdrawal.Currency))
	utils.SendResponse(c, withdrawal, "Withdrawal Request approved", http.StatusOK)
}

// DeclineWithdrawal request
func DeclineWithdrawal(c *gin.Context) {
	var (
		data       map[string]string
		withdrawal models.AnchorWithdrawal
		user       models.User
	)
	id := c.Param("id")
	_ = json.NewDecoder(c.Request.Body).Decode(&data)
	err := DB.Where("id = ?", id).First(&withdrawal).Error
	if err != nil {
		log.Errorf("failed to retrieve withdrawal request, %+v", err)
		utils.ErrException(c, "Withdrawal request not found", http.StatusBadRequest)
		return
	}
	err = DB.Where("id = ?", withdrawal.UserID).First(&user).Error
	if err != nil {
		log.Errorf("failed to retrieve withdrawal user, %+v", err)
		utils.ErrException(c, "Withdrawal request not found", http.StatusBadRequest)
		return
	}
	withdrawal.Status = 2
	DB.Save(&withdrawal)
	amount := safeCurrency.MNDA(withdrawal.Amount).Moneda()
	declineMessage := fmt.Sprintf("Your withdrawal request for %2f %s was declined. Here's what an admin wrote:\n [[ %s ]]", amount, withdrawal.Currency, data["reason"])
	log.Infof("declineMessage: %s\n", declineMessage)
	go utils.SendGenericMail(user.Email, "Withdrawal Request Declined", declineMessage)
	utils.SendResponse(c, withdrawal, "Withdrawal Request declined", http.StatusOK)
}

// Adminify creates/updates a new admin profile
func Adminify(c *gin.Context) {
	var (
		data map[string]string
		user models.User
	)
	_ = json.NewDecoder(c.Request.Body).Decode(&data)
	log.Printf("adminify data: %+v", data)
	err := DB.Where("email = ?", data["email"]).Find(&user).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		log.Errorf("failed to fetch user [adminify]: %+v", err)
		return
	}
	if err == gorm.ErrRecordNotFound {
		user.FirstName = data["admin_firstname"]
		user.LastName = data["admin_lastname"]
		user.Email = data["admin_email"]
		password, err := bcrypt.GenerateFromPassword([]byte(data["admin_password"]), 10)
		if err != nil {
			log.Errorf("failed to create admin password: %+v", err)
			utils.ErrException(c, "Failed to create admin user", http.StatusBadGateway)
		}
		user.Password = string(password)
	}
	user.IsAdmin = true
	user.IsActive = true
	DB.Save(&user)
	utils.SendResponse(c, user, "Admin User created", http.StatusCreated)
}

// GetChargedFees retrieves all fees charged on various transaction types
func GetChargedFees(c *gin.Context) {
	var (
		fees []models.Fee
		data = make(map[string][]map[string]interface{})
	)

	err := DB.Find(&fees).Error
	if err != nil {
		log.Errorf("failed to retrieve fees_charged: %+v", err)
		utils.ErrException(c, "Fees request not successful", http.StatusNotFound)
		return
	}
	if data["fees"] == nil {
		data["fees"] = []map[string]interface{}{}
	}
	for _, fee := range fees {
		feeData := make(map[string]interface{})
		var user models.User
		err := DB.Where("id = ?", fee.ChargedTo).Find(&user).Error
		if err != nil {
			log.Errorf("failed to retrieve fees_charged: %+v", err)
			utils.ErrException(c, "Fees request not successful", http.StatusNotFound)
			return
		}
		feeData["type"] = fee.Type
		feeData["user_id"] = fee.ChargedTo
		feeData["full_name"] = fmt.Sprintf("%s %s", user.FirstName, user.LastName)
		feeData["base_amount"] = safeCurrency.MNDA(fee.BaseAmount).Moneda()
		feeData["amount_charged"] = safeCurrency.MNDA(fee.AmountCharged).Moneda()
		feeData["currency"] = fee.Currency
		feeData["created_at"] = fee.CreatedAt
		data["fees"] = append(data["fees"], feeData)
	}
	utils.SendResponse(c, data["fees"], emptyString, http.StatusOK)
}

// UpdateSettings updates app specifics settings on admin
func UpdateSettings(c *gin.Context) {
	var data map[string]string
	_ = json.NewDecoder(c.Request.Body).Decode(&data)
	tx := DB.Begin()
	for label, value := range data {
		log.Infof("label: %s value: %s", label, value)
		var config models.Config
		err := tx.Where("label = ?", label).Find(&config).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			tx.Rollback()
			log.Errorf("failed to retrieve config, %+v", err)
			utils.ErrException(c, "An error occurred while updating settings", http.StatusBadRequest)
			return
		}
		if config.ID < 1 && label != "" {
			config.Label = label
			if label == "anchor_withdrawal" {
				config.Type = "fees"
			} else {
				config.Type = "bank"
			}
			config.Value = value
			tx.Save(&config)
		}
		if config.ID > 0 {
			config.Value = value
			tx.Save(&config)
		}
	}
	tx.Commit()
	utils.SendResponse(c, nil, "Settings has been updated", http.StatusOK)
}

// PurgeInactiveACHRequests declines pending ach requests without proof
func PurgeInactiveACHRequests(c *gin.Context) {
	var (
		achTransfers []models.ACHTransferRequest
	)
	err := DB.Raw("SELECT * FROM ach_transfer_requests WHERE status = 0 AND proof = '' AND created_at <= now() - '3 days'::interval").Scan(&achTransfers).Error
	if err != nil {
		log.Errorf("failed retrieve recent_ach_transfers: %+v", err)
		//utils.ErrException(c, "An error occurred while retrieving data", http.StatusNotFound)
	}
	for _, transfer := range achTransfers {
		var user models.User
		DB.Model(&transfer).Related(&user)
		transfer.Status = models.ACH_DECLINED
		DB.Save(&transfer)
		go utils.SendGenericMail(user.Email, "ACH Transfer Request Declined", fmt.Sprintf("Your ACH Transfer request with reference <b>%s</b> has been declined as no payment proof was submitted within the last three (3) days.", transfer.TransactionReference))
	}
	utils.SendResponse(c, nil, "Invalid ACH Requests have been purged", http.StatusOK)
}
