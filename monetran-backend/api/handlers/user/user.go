package user

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	log "github.com/codehakase/monetran/api/logger"
	. "github.com/codehakase/monetran/api/models"
	"github.com/codehakase/monetran/api/utils"
	jwt "github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
	"golang.org/x/crypto/bcrypt"
)

var (
	DB      *gorm.DB
	message string
	//supportedExts = []string{"png", "jpg", "jpeg"}
	supportedExts = []string{"jpg", "png", "gif", "bmp", "jpeg", "pdf"}
)

// SetState initializes runtime dependencies
func SetState(db *gorm.DB) {
	DB = db
}

// GetProfile returns the authenticated user account
func GetProfile(c *gin.Context) {
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to fetch profile: %+v", err)
		utils.ErrException(c, "An error occurred while requesting a refund", http.StatusBadRequest)
		return
	}
	// pull user relationsips
	wallet := Wallet{}
	bankInfo := Bank{}
	DB.Model(&user).Related(&bankInfo)
	DB.Model(&user).Related(&wallet)

	user.Wallet = wallet
	user.BankInfo = bankInfo
	if user.ImageUrl != "" {
		signedURL, _ := utils.GetGCSSignedURL(user.ImageUrl)
		user.ImageUrl = signedURL
	}
	utils.SendResponse(c, &user, "", http.StatusOK)
}

// GetBankDetails retrieves the bank details saved for a user
func GetBankDetails(c *gin.Context) {
	var user User
	id := c.Param("id")
	if id == "" {
		utils.ErrException(c, "User not found", http.StatusNotFound)
		return
	}
	err := DB.Where("id = ?", id).First(&user).Error
	if err != nil {
		log.Errorf("failed to retrieve user: %v", err)
		utils.ErrException(c, "User not found", http.StatusNotFound)
		return
	}
	bankData := Bank{}
	DB.Model(&user).Related(&bankData)
	utils.SendResponse(c, bankData, "", http.StatusOK)
}

// UploadImage uploads user profile image to Google Cloud Storage
func UploadImage(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		log.Errorf("error parsing user uploaded image: %v", err)
		utils.ErrException(c, "An error occurred while uploading your image", http.StatusBadRequest)
		return
	}
	// read file extension and validate
	if !isValidExt(file.Filename) {
		log.Errorf("image extension: %+v", file.Filename)
		log.Errorf("invalid image upload type: %+v", err)
		utils.ErrException(c, "Image format not supported", http.StatusBadRequest)
		return
	}
	actualFile, err := file.Open()
	if err != nil {
		log.Errorf("failed to open multipart file: %+v", err)
		utils.ErrException(c, "An error occurred while uploading your image", http.StatusBadRequest)
		return
	}
	defer actualFile.Close()
	imageURL, err := utils.UploadToGCS(actualFile, file.Filename, false)
	if err != nil {
		log.Errorf("failed to upload multipart file: %+v", err)
		utils.ErrException(c, "An error occurred while uploading your image", http.StatusBadRequest)
		return
	}
	utils.SendResponse(c, gin.H{"image_url": imageURL}, "image uploaded successfully", http.StatusOK)
}

func isValidExt(filename string) bool {
	parts := strings.Split(filename, ".")
	extension := parts[len(parts)-1]
	for _, ext := range supportedExts {
		if strings.EqualFold(extension, ext) {
			//if extension == ext {
			return true
		}
	}
	return false
}

// UpdateImageUrl updates a user profile photo, with provider terms"
func UpdateImageUrl(c *gin.Context) {
	var data map[string]string
	err := json.NewDecoder(c.Request.Body).Decode(&data)
	if err != nil {
		log.Errorf("faled to parse payload, err: %+v", err)
		utils.ErrException(c, "An error occurred while processing request", http.StatusBadRequest)
		return
	}
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Printf("failed to fetch profile: %+v", err)
		utils.ErrException(c, "An error occurred while updating profile image", http.StatusBadRequest)
		return
	}
	user.ImageUrl = data["url"]
	DB.Save(&user)
	utils.SendResponse(c, user, "Profile image updated successfully", http.StatusCreated)
}

// RetrieveGCSObject creates a signed url to access objects uploaded to Google Cloud Storage
func RetrieveGCSObject(c *gin.Context) {
	var data map[string]string
	err := json.NewDecoder(c.Request.Body).Decode(&data)
	if err != nil {
		log.Errorf("faled to parse payload, err: %+v", err)
		utils.ErrException(c, "An error occurred while processing request", http.StatusBadRequest)
		return
	}
	log.Infof("gcsobject data: %+v", data)
	signedURL, err := utils.GetGCSSignedURL(data["filename"])
	if err != nil {
		log.Errorf("failed to retrieve GCS file: %+v", err)
		utils.ErrException(c, "An error occurred while processing request", http.StatusBadRequest)
		return
	}
	utils.SendResponse(c, signedURL, "", http.StatusCreated)
}

// UploadKYCDoc creates a new trustdoc record for user
func UploadKYCDoc(c *gin.Context) {
	var (
		data      map[string]string
		trustdocs []TrustDoc
	)
	err := json.NewDecoder(c.Request.Body).Decode(&data)
	if err != nil {
		log.Errorf("faled to parse payload, err: %+v", err)
		utils.ErrException(c, "An error occurred while processing request", http.StatusBadRequest)
		return
	}
	if data["url"] == "" || data["type"] == "" {
		utils.ErrException(c, "An error occurred while processing request, check input", http.StatusBadRequest)
		return
	}
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to upload kyc: %+v", err)
		utils.ErrException(c, "An error occurred while uploading kyc doc", http.StatusBadRequest)
		return
	}
	// retrieve user kyc docs, non-verified
	DB.Where("user_id = ? and is_verified = ?", user.ID, false).Find(&trustdocs)
	if len(trustdocs) >= 2 {
		utils.ErrException(c, "Previous uploaded KYC docs are still pending verification", http.StatusBadRequest)
		return
	}
	doc := &TrustDoc{
		UserID:   user.ID,
		FileName: data["url"],
		Type:     data["type"],
	}
	DB.Create(&doc)
	signedURL, _ := utils.GetGCSSignedURL(user.ImageUrl)
	user.ImageUrl = signedURL

	go utils.SendGenericMail(user.Email, "KYC Document of type '"+data["type"]+"' uploaded", "KYC Document of type '"+data["type"]+"' uploaded with pending verification.")
	go utils.SendGenericMail(os.Getenv("EMAIL_ADMIN"), "KYC Document of type '"+data["type"]+"' uploaded", "KYC Document of type '"+data["type"]+"' uploaded and needs verification.")

	utils.SendResponse(c, &user, "KYC Document uploaded", http.StatusCreated)
}

// TrustDocs retrieves all user KYC uploaded docs
func TrustDocs(c *gin.Context) {
	var docs []TrustDoc
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to upload kyc: %+v", err)
		utils.ErrException(c, "An error occurred while uploading kyc doc", http.StatusBadRequest)
		return
	}
	// retrieve user kyc docs
	DB.Where("user_id = ?", user.ID).Find(&docs)
	utils.SendResponse(c, docs, "", http.StatusOK)
}

// UpdateProfile updates a user profile
func UpdateProfile(c *gin.Context) {
	var (
		data     map[string]string
		bankinfo Bank
	)
	err := json.NewDecoder(c.Request.Body).Decode(&data)
	if err != nil {
		log.Errorf("faled to parse payload, err: %+v", err)
		utils.ErrException(c, "An error occurred while processing request", http.StatusBadRequest)
		return
	}
	user, err := utils.UserFromAuth(DB, c)
	if err != nil {
		log.Errorf("failed to update profile: %+v", err)
		utils.ErrException(c, "An error occurred while requesting a refund", http.StatusBadRequest)
		return
	}
	tx := DB.Begin()
	// fetch existing bank info
	tx.Where("user_id = ?", user.ID).First(&bankinfo)
	if bankinfo.ID == 0 && data["bank_info"] != "" { // user doesn't have a bank info set
		bankinfo = Bank{
			AccountName:   data["account_name"],
			AccountNumber: data["account_number"],
			BankName:      data["bank_name"],
			SortCode:      data["sort_code"],
			UserID:        user.ID,
		}
		err = tx.Create(&bankinfo).Error
		if err != nil {
			log.Errorf("failed to update profile: %+v", err)
			tx.Rollback()
			utils.ErrException(c, "An error occurred while updating profile", http.StatusBadRequest)
			return
		}
		user.BankInfo = bankinfo
	}
	if data["bank_info"] != "" {
		bankinfo.AccountName = data["account_name"]
		bankinfo.AccountNumber = data["account_number"]
		bankinfo.BankName = data["bank_name"]
		bankinfo.SortCode = data["sort_code"]
		bankinfo.BankAddress = data["bank_address"]
		tx.Save(&bankinfo)
		user.BankInfo = bankinfo
	}
	user.FirstName = data["firstname"]
	user.LastName = data["lastname"]
	use2fa, _ := strconv.ParseBool(data["use_2fa"])
	user.Use2fA = use2fa
	tx.Save(&user)
	tx.Commit()
	utils.SendResponse(c, user, "Profile updated successfully", http.StatusOK)
}

// Auth authorizes a user
func Auth(c *gin.Context) {
	var (
		credentials struct {
			Email         string `json:"email"`
			Password      string `json:"password"`
			WithOAuth     bool   `json:"with_oauth"`
			OAuthProvider string `json:"oauth_provider"`
			OAuthUID      string `json:"oauth_uid"`
		}
		user User
	)
	err := json.NewDecoder(c.Request.Body).Decode(&credentials)
	if err != nil {
		utils.ErrException(c, "An error occurred while processing request", http.StatusBadRequest)
		return
	}

	// convert email to lower-case
	if credentials.Email != "" {
		credentials.Email = strings.ToLower(credentials.Email)
	}

	if credentials.WithOAuth {
		DB.Where("o_auth_uid = ? AND o_auth_provider = ?", credentials.OAuthUID, credentials.OAuthProvider).First(&user)
		if user.IsEmpty() {
			utils.ErrException(c, "Invalid credentials sent", 401)
			return
		}
	} else {
		if credentials.Email == "" || credentials.Password == "" {
			utils.ErrException(c, "Invalid credentials sent", 401)
			return
		}
		DB.Where("email = ?", credentials.Email).First(&user)
		log.Infof("user %+v l: %+v", user, user.IsEmpty())
		if user.IsEmpty() {
			utils.ErrException(c, "Invalid credentials sent", 401)
			return
		}
		err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(credentials.Password))
		if err != nil {
			utils.ErrException(c, "Invalid credentials sent", 401)
			return
		}
		if !user.IsActive {
			utils.ErrException(c, "You haven't verified your email address yet, please do so to be able to login", 401)
			return
		}
	}
	u := beautifyUserModel(c, &user)

	utils.SendResponse(c, map[string]interface{}{
		"user": &u,
	}, message, http.StatusOK)
}

// GenerateOTP generates a verification code to authenticate a device
func GenerateOTP(c *gin.Context) {
	var user User
	userID := c.Param("user_id")
	err := DB.Where("id = ?", userID).First(&user).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		log.Errorf("failed to retrieve otp user: %+v", err)
		utils.ErrException(c, "An error occurred while processing request", http.StatusBadRequest)
		return
	}
	rand.Seed(time.Now().UnixNano())
	randOTP := func(min int, max int) int {
		return rand.Intn(max-min) + min
	}(1000, 9999)
	otp := strconv.Itoa(randOTP)
	// reusing same model it shares structure for otp
	request := EmailVerification{
		Token:  otp,
		UserID: user.ID,
	}
	DB.Create(&request)
	go utils.DispatchNewOTPNotification(user, otp)
	utils.SendResponse(c, nil, "OTP Generated successfully", http.StatusCreated)
}

// ResetPasswordRequest sends a password reset request to a user
func ResetPasswordRequest(c *gin.Context) {
	var (
		data map[string]interface{}
		user User
	)
	err := json.NewDecoder(c.Request.Body).Decode(&data)
	if err != nil {
		log.Errorf("failed to parse verifyToken req: %+v", err)
		utils.ErrException(c, "An error occurred while processing your request", http.StatusBadRequest)
		return
	}
	err = DB.Where("email = ?", data["email"]).First(&user).Error
	if err != nil {
		utils.ErrException(c, "We couldn't find a user with that email", http.StatusBadRequest)
		return
	}
	hash := sha256.Sum256([]byte(user.Email))
	hashStr := hex.EncodeToString(hash[:])
	request := EmailVerification{
		Token:  hashStr,
		UserID: user.ID,
	}
	DB.Create(&request)
	go utils.DispatchPasswordResetMail(user, hashStr)
	utils.SendResponse(c, nil, "Password reset instructions sent", http.StatusCreated)
}

// ResetPassword verifies and updates a user's password
func ResetPassword(c *gin.Context) {
	var (
		data  map[string]interface{}
		token EmailVerification
		user  User
	)
	err := json.NewDecoder(c.Request.Body).Decode(&data)
	if err != nil {
		log.Errorf("faled to parse payload, err: %+v", err)
		utils.ErrException(c, "An error occurred while processing request", http.StatusBadRequest)
		return
	}
	if data["source"] == nil {
		err = DB.Where("token = ?", data["resetToken"]).First(&token).Error
		if err != nil {
			utils.ErrException(c, "Password reset request has expired", http.StatusBadRequest)
			return
		}
		if token.Token != data["resetToken"] {
			utils.ErrException(c, "Password reset request has expired", http.StatusNotFound)
			return
		}
		err = DB.Where("id = ?", token.UserID).First(&user).Error
		if err != nil {
			utils.ErrException(c, "An error occurred while processing request", http.StatusBadRequest)
			return
		}
	}

	if data["currentPassword"] != nil {
		err = DB.Where("email = ?", data["source"].(string)).First(&user).Error
		if err != nil {
			log.Infof("%#v", err)
			utils.ErrException(c, "Password is incorrect", 401)
			return
		}
		err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(data["currentPassword"].(string)))
		if err != nil {
			utils.ErrException(c, "Password is incorrect", 401)
			return
		}
	}

	if len(data["password"].(string)) < 1 || data["password"] != data["passwordConfirmation"] {
		utils.ErrException(c, "Passwords do not match", http.StatusBadRequest)
		return
	}
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(data["password"].(string)), 10)
	if err != nil {
		log.Errorf("failed to hash user password: %+v", err)
		utils.ErrException(c, "An error occurred while processing request", http.StatusBadRequest)
		return
	}
	user.Password = string(passwordHash)
	DB.Save(&user)
	//if data["source"] == nil {
	//  DB.Delete(&token)
	//}
	DB.Delete(EmailVerification{}, "user_id = ?", token.UserID)
	
	go utils.DispatchPasswordChangedMail(user)
	utils.SendResponse(c, nil, "Password changed successfully", http.StatusCreated)
}

// VerifyOTP verifies an OTP
func VerifyOTP(c *gin.Context) {
	var (
		data  map[string]string
		token EmailVerification
		user  User
	)
	err := json.NewDecoder(c.Request.Body).Decode(&data)
	if err != nil {
		log.Errorf("faled to parse payload, err: %+v", err)
		utils.ErrException(c, "An error occurred while processing request", http.StatusBadRequest)
		return
	}
	err = DB.Where("email = ?", strings.ToLower(data["email"])).First(&user).Error
	if err != nil {
		utils.ErrException(c, "An error occurred while processing request", http.StatusBadRequest)
		return
	}

	err = DB.Where("token = ? and user_id = ?", data["code"], user.ID).Last(&token).Error
	if err != nil {
		utils.ErrException(c, "Invalid verification code provided", http.StatusBadRequest)
		return
	}
	if token.Token != data["code"] {
		utils.ErrException(c, "Invalid verification code provided", http.StatusNotFound)
		return
	}
	err = DB.Where("id = ? and email = ?", token.UserID, strings.ToLower(data["email"])).First(&user).Error
	if err != nil {
		utils.ErrException(c, "An error occurred while processing request", http.StatusBadRequest)
		return
	}

	log.Infof("user %+v l: %+v", user, user.IsEmpty())
	if user.IsEmpty() {
		utils.ErrException(c, "Invalid credentials sent", 401)
		return
	}

	//DB.Delete(&token)
	DB.Delete(EmailVerification{}, "user_id = ?", token.UserID)
	
	u := beautifyUserModel(c, &user)
	utils.SendResponse(c, u, "", http.StatusOK)
}

// Register creates a new User account
func Register(c *gin.Context) {
	var (
		data map[string]string
	)
	err := json.NewDecoder(c.Request.Body).Decode(&data)
	if err != nil {
		log.Errorf("faled to parse payload, err: %+v", err)
		utils.ErrException(c, "An error occurred while processing request", http.StatusBadRequest)
		return
	}

	// convert email to lower-case
	if val, ok := data["email"]; ok {
		data["email"] = strings.ToLower(val)
	}

	user, err := validateAndReturnUser(data)
	if err != nil {
		log.Errorf("faled to validate payload, err: %+v", err)
		utils.ErrException(c, err.Error(), http.StatusBadRequest)
		return
	}
	// confirm user doesn't exit
	var userExist User
	DB.Where("email = ?", user.Email).First(&userExist)
	if userExist.ID > 0 { // user exists
		log.Errorf("failed to create user, user already exist user: %+v", user)
		utils.ErrException(c, "An account already exist with this email", http.StatusBadRequest)
		return
	}
	// begin db transaction
	tx := DB.Begin()

	err = tx.Create(&user).Error
	if err != nil {
		log.Errorf("failed to create user, err: %+v, user: %+v", err, user)
		tx.Rollback()
		utils.ErrException(c, "An error occurred while processing your request", http.StatusBadRequest)
		return
	}

	// create user wallets
	err = createUserWallets(tx, user)
	if err != nil {
		log.Errorf("failed to create user wallets, err: %+v, user: %+v", err, user)
		tx.Rollback()
		utils.ErrException(c, "An error occurred while processing your request", http.StatusBadRequest)
		return
	}
	// commit transaction, and return response
	tx.Commit()
	// send email notification
	go utils.NewEmailVerification(DB, user)
	utils.SendResponse(c, user, "User account created", http.StatusCreated)
}

// VerifyEmail verifies the email registered with User is valid
func VerifyEmail(c *gin.Context) {
	var (
		data        map[string]string
		user        User
		verifyToken EmailVerification
	)
	err := json.NewDecoder(c.Request.Body).Decode(&data)
	if err != nil {
		log.Errorf("failed to parse verifyToken req: %+v", err)
		utils.ErrException(c, "An error occurred while processing your request", http.StatusBadRequest)
		return
	}
	err = DB.Where("token = ?", data["token"]).First(&verifyToken).Error
	if err != nil {
		log.Errorf("failed to verifyToken req: %+v", err)
		utils.ErrException(c, "Invalid Verification Token", http.StatusBadRequest)
		return
	}
	err = DB.Where("id = ?", verifyToken.UserID).First(&user).Error
	if err != nil {
		log.Errorf("failed to fetch user: %+v", err)
		utils.ErrException(c, "An error occurred while processing your request", http.StatusBadRequest)
		return
	}
	// activate user
	user.IsActive = true
	DB.Save(&user)

	//DB.Delete(&token)
	DB.Delete(EmailVerification{}, "user_id = ?", verifyToken.UserID)

	utils.SendResponse(c, user, "Email verified", http.StatusOK)
}

// GetFederationData retrieves a human-readable account ID for user
func GetFederationData(c *gin.Context) {
	if len(c.Request.URL.Query()) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"detail": "missing parameters, excepted parameter q and parameter type",
		})
		return
	}
	switch c.Query("type") {
	case "name":
		c.JSON(http.StatusOK, getFedRecordFromName(c, strings.ToLower(c.Query("q"))))
		break
	case "id":
		c.JSON(http.StatusOK, getFedRecordFromID(c, c.Query("q")))
		break
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"detail": "Unhandled type",
		})
		return
	}
}

func getFedRecordFromName(c *gin.Context, q string) map[string]interface{} {
	var user User
	err := DB.Where("federation_address = ?", q).First(&user).Error
	if err != nil {
		return map[string]interface{}{"detail": "No record found."}
	}
	return formatFedData(user)
}
func getFedRecordFromID(c *gin.Context, q string) map[string]interface{} {
	var user User
	if q == os.Getenv("WALLET_PUB_KEY") {
		err := DB.Where("federation_address = ?", os.Getenv("APP_FED_URL")).First(&user).Error
		if err != nil {
			return map[string]interface{}{"detail": "No record found."}
		}
		return formatFedData(user)
	}
	err := DB.Where("account_id = ?", q).First(&user).Error
	if err != nil {
		return map[string]interface{}{"detail": "No record found."}
	}
	return formatFedData(user)
}

func formatFedData(user User) map[string]interface{} {
	if user.Memo != "" {
		return map[string]interface{}{
			"stellar_address": user.FederationAddress,
			"account_id":      os.Getenv("WALLET_PUB_KEY"),
			"memo":            user.Memo,
			"memo_type":       user.MemoType,
		}
	}
	return map[string]interface{}{
		"stellar_address": user.FederationAddress,
		"account_id":      os.Getenv("WALLET_PUB_KEY"),
	}
}

// validateAndReturnUser validates the data fields and returns a pointer to a
// new User model struct
func validateAndReturnUser(data map[string]string) (*User, error) {
	if data["with_oauth"] == "" {
		if !keysExistInMap([]string{"firstname", "lastname", "password", "confirmPassword"}, data) {
			return nil, errors.New("needed credentials keys not present")
		}
		if data["firstname"] == "" || data["lastname"] == "" || data["password"] == "" || data["confirmPassword"] == "" || data["email"] == "" {
			return nil, fmt.Errorf("Some data was sent in empty, confirm input")
		}
		if data["password"] != data["confirmPassword"] {
			return nil, errors.New("Password confirmation failed")
		}
	}
	memo := utils.GenerateMemo()
	fedAddress := fmt.Sprintf("%s*%s", data["email"], os.Getenv("APP_URL"))
	user := &User{
		FirstName:         data["firstname"],
		LastName:          data["lastname"],
		Email:             data["email"],
		AccountID:         os.Getenv("WALLET_PUB_KEY"),
		MemoType:          "text",
		Memo:              memo,
		FederationAddress: fedAddress,
		Use2fA:            true,
	}
	if data["with_oauth"] == "" {
		password, err := bcrypt.GenerateFromPassword([]byte(data["password"]), 10)
		if err != nil {
			return nil, err
		}
		user.Password = string(password)
	} else {
		user.OAuthProvider = data["oauth_provider"]
		user.OAuthUID = data["oauth_uid"]
	}
	return user, nil
}

// createUserWallets create wallets entries for User
func createUserWallets(tx *gorm.DB, user *User) error {
	mndaWallet := getWallet("mnda", user.ID)
	if err := tx.Create(mndaWallet).Error; err != nil {
		return err
	}
	return nil
}

// beautifyUserModel formats a user model with data needed by the client
func beautifyUserModel(c *gin.Context, user *User) *User {
	// pull user relationsips
	wallet := Wallet{}
	bankInfo := Bank{}
	DB.Model(&user).Related(&bankInfo)
	DB.Model(&user).Related(&wallet)

	user.Wallet = wallet
	user.BankInfo = bankInfo
	token := genToken(c, user)
	user.AccessToken = token
	if user.ImageUrl != "" {
		signedURL, _ := utils.GetGCSSignedURL(user.ImageUrl)
		user.ImageUrl = signedURL
	}
	return user
}

func genToken(c *gin.Context, user *User) string {
	token := jwt.New(jwt.SigningMethodHS256)

	// create map to store our claims
	claims := token.Claims.(jwt.MapClaims)

	// set token claims
	claims["id"] = user.ID
	claims["email"] = user.Email
	claims["exp"] = time.Now().Add(time.Hour * 8).Unix()
	//claims["exp"] = time.Now().Add(time.Minute * 5).Unix()
	claims["gentype"] = "handshake"
	// sign token with secret
	tokenStr, err := token.SignedString([]byte(os.Getenv("API_SECRET")))
	if err != nil {
		utils.ErrException(c, "Invalid credentials sent", http.StatusUnauthorized)
		os.Exit(1)
	}
	return tokenStr
}

func keysExistInMap(keys []string, data map[string]string) bool {
	for _, k := range keys {
		if _, ok := data[k]; !ok {
			return false
		}
	}
	return true
}

func getWallet(label string, userid uint) *Wallet {
	var (
		code     string
		currency string
	)
	switch label {
	case "xlm":
		code = "XLM"
		currency = "Stellar Lumen"
		break
	case "mnda":
		code = "MNDA"
		currency = "Moneda"
	}
	return &Wallet{
		Code:      code,
		Currency:  currency,
		UserID:    userid,
		Activated: true,
	}
}
