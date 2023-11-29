package utils

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"io/ioutil"
	"math"
	"math/rand"
	"mime/multipart"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	safeCurrency "github.com/codehakase/monetran/api/utils/middleware"

	"cloud.google.com/go/storage"
	"github.com/BurntSushi/toml"
	log "github.com/codehakase/monetran/api/logger"
	"github.com/codehakase/monetran/api/models"
	jwt "github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	gcontext "github.com/gorilla/context"
	"github.com/jinzhu/gorm"
	"github.com/oklog/ulid"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
	gomail "gopkg.in/gomail.v2"
)

type emailData = struct {
	VerifyUrl string
}

type response struct {
	Status  string      `json:"status"`
	Code    int         `json:"code"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// NewEmailVerification dispatches a new email verification mail to a User
func NewEmailVerification(tx *gorm.DB, user *models.User) {
	emailData := &emailData{}
	// generate token
	token := GenerateMemo()
	// save token
	tx.Create(&models.EmailVerification{
		Token:  token,
		UserID: user.ID,
	})
	emailData.VerifyUrl = fmt.Sprintf("https://%s/#/account/verify?t=%s", os.Getenv("APP_URL"), token)
	emailBody := parseTemplate(emailData)
	mailer(user.Email, "New Account On Monetran", emailBody)
}

// DispatchAnchorRequestNotification dispatches a new anchor request
// notification
func DispatchAnchorRequestNotification(email string, request *models.AnchorWithdrawal) {
	amount := safeCurrency.MNDA(request.Amount).Moneda()
	emailBody := fmt.Sprintf("Your Anchor withdraw request of %.2f %s has been received, and is being reviewed. You'll receive a notification from us on any actions taken on your request.", amount, request.Currency)
	SendGenericMail(email, "Anchor Request Received", emailBody)
}

// DispatchTransferRequestNotification dispatches a new transfer request
// notification
func DispatchTransferRequestNotification(DB *gorm.DB, request *models.Transfer) {}

// DispatchUserWalletFunded notifies user of new wallet activities
func DispatchUserWalletFunded(user models.User, amount float64, slug, medium string) {
	var emailStr = `
		Hi,
		<br><br>
		Your wallet has been funded with %v %s via %s
		<br><br>

		Thanks,<br><br>
		Monetran Team
	`
	var adminEmailStr = `
		Hello,
		<br><br>
		User %s wallet has been funded with %v %s via %s.
	`
	emailBody := fmt.Sprintf(emailStr, amount, slug, medium)
	adminEmailBody := fmt.Sprintf(adminEmailStr, user.Email, amount, slug, medium)
	go mailer(user.Email, "Your Wallet has been funded", emailBody)
	go mailer("info@monetran.com", "User wallet has been funded", adminEmailBody)
}

// DispatchNewOTPNotification sends an otp to user
func DispatchNewOTPNotification(user models.User, otp string) {
	var emailStr = `
	Hey %s!<br><br>

	A sign in attempt requires further authentication. To complete the sign in, enter the 2FA code.
	<br><br>
	Verification code: <mark><b>%s</b></mark>
	<br><br>
	If you did not attempt to sign in to your account, your password may be compromised. Reply this email so our Admins can secure your account. 
<br><br><br>
	Thanks,
	The Monetran Team
	`
	emailbody := fmt.Sprintf(emailStr, user.FirstName, otp)
	go mailer(user.Email, "2-Factor Authentication", emailbody)
}

// DispatchPasswordResetMail sends a password request mail to user
func DispatchPasswordResetMail(user models.User, hash string) {
	var emailStr = `
		Someone (hopefully you) has requested a password reset for your Monetran account.
		Follow the link below to set a new password:
		<br><br>
		%s
		<br><br>
		If you don't wish to reset your password, disregard this email and no action will be taken.
		<br><br><br>
		The Monetran Team
		<br>
		https://monetran.com
	`
	resetURL := fmt.Sprintf("https://%s/#/account/password/reset/%s", os.Getenv("APP_URL"), hash)
	emailbody := fmt.Sprintf(emailStr, resetURL)
	go mailer(user.Email, "Reset your Monetran password", emailbody)

}

// DispatchPasswordChangedMail sends a notification to user on password change
func DispatchPasswordChangedMail(user models.User) {
	var emailStr = `
		Hi %s,
		<br><br>
		We’ve changed your password, as you asked. To view or change your account information, visit your Account.
		<br><br>
		If you did not ask to change your password we are here to help secure your account, just contact us.
		<br><br>
		The Monetran Team
		<br>
		https://monetran.com
	`
	emailbody := fmt.Sprintf(emailStr, user.FirstName)
	go mailer(user.Email, "Your password has been changed", emailbody)
}

// SendGenericMail sends a mail with a provided email, subject and body
func SendGenericMail(email, subject, body string) {
	var emailStr = `
		Hi,
		<br><br>
		%s
		<br><br>
		Thanks,<br><br>
		Monetran Team
	`
	emailBody := fmt.Sprintf(emailStr, body)
	mailer(email, subject, emailBody)
}

func mailer(
	to,
	subject,
	templateData string,
) {
	mailer := gomail.NewMessage()
	mailer.SetHeader("From", "Monetran <info@monetran.com>")
	mailer.SetHeader("To", to)
	mailer.SetHeader("Subject", subject)
	mailer.SetBody("text/html", templateData)
	// create dialer
	mailPort, _ := strconv.Atoi(os.Getenv("EMAIL_PORT"))
	d := gomail.NewPlainDialer(os.Getenv("EMAIL_HOSTNAME"), mailPort, os.Getenv("EMAIL_USER"), os.Getenv("EMAIL_PASS"))
	d.TLSConfig = &tls.Config{InsecureSkipVerify: true}
	// send email to recipients
	if err := d.DialAndSend(mailer); err != nil {
		log.Errorf("failed to send email verification, err: %+v, user: %+v", err, to)
	}
	mailer.Reset()
	log.Infof("Email was sent to user: %+v, subject: %+v, with body: %+v", to, subject, templateData)
}

// UserFromAuth fetches the authenticated user from the request context
func UserFromAuth(DB *gorm.DB, c *gin.Context) (*models.User, error) {
	var user models.User
	ctxClaims := gcontext.Get(c.Request, "decoded")
	if ctxClaims == nil {
		return nil, fmt.Errorf("user id doesn't exist in context")
	}
	claims := ctxClaims.(jwt.MapClaims)
	if _, ok := claims["id"]; !ok {
		return nil, fmt.Errorf("user id doesn't exist in context")
	}
	err := DB.Where("id = ? and email = ?", claims["id"], claims["email"]).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GenerateMemo generates a new User memo
func GenerateMemo() string {
	t := time.Now().UTC()
	entropy := rand.New(rand.NewSource(t.UnixNano()))
	id := ulid.MustNew(ulid.Timestamp(t), entropy)
	return id.String()
}

// ErrException returns an unsuccessful request to client
func ErrException(c *gin.Context, message string, code int) {
	log.Errorf("[HTTP ERROR] ERR: %v CODE: %v", message, code)
	c.JSON(code, response{
		Status:  "error",
		Code:    code,
		Message: message,
	})
}

// SendResponse returns a successful json request object/headers
func SendResponse(c *gin.Context, data interface{}, message string, code int) {
	c.JSON(code, response{
		Status:  "success",
		Code:    code,
		Message: message,
		Data:    data,
	})
}

// GetNGNRate returns the exchange rate for USD/NGN
func GetNGNRate(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"rate": os.Getenv("NGN_RATE"),
	})
}
func parseTemplate(data interface{}) string {
	tempLocation := os.Getenv("VERIFY_EMAIL_TEMP_LOC")
	tmpl := template.Must(template.New("verifyemail.html").ParseFiles(tempLocation))
	buff := new(bytes.Buffer)
	if err := tmpl.Execute(buff, data); err != nil {
		log.Fatalf("failed to parse/execute verify email temp, err: %+v", err)
	}
	return buff.String()
}

func InStringSlice(s []string, entry string) bool {
	for _, item := range s {
		if item == entry {
			return true
		}
	}
	return false
}

// RetrieveConfig retrieves configs for a type
func RetrieveConfig(c *gin.Context, DB *gorm.DB) {
	var settings []models.Config
	configType := c.Param("type")
	if configType == "all" {
		DB.Find(&settings)
		SendResponse(c, settings, "", http.StatusOK)
		return
	}
	settings = models.WithType(configType, DB)
	SendResponse(c, settings, "", http.StatusOK)
}

// SaveConfig creates a new config record
func SaveConfig(c *gin.Context, DB *gorm.DB) {
	var (
		data    map[string]interface{}
		configs []models.Config
	)
	err := json.NewDecoder(c.Request.Body).Decode(&data)
	if err != nil {
		log.Errorf("config data decode failed: %+v", err)
	}
	for _, config := range data["configs"].([]interface{}) {
		label := config.(map[string]interface{})["label"]
		configType := config.(map[string]interface{})["type"]
		value := config.(map[string]interface{})["value"]
		if exists := models.ConfigExists(label.(string), configType.(string), value.(string), DB); exists {
			log.Errorf("config %+v already exists", config)
			continue
		}
		cfg, err := models.NewConfig(DB, configType.(string), label.(string), value.(string))
		if err != nil {
			log.Errorf("config %+v failed to save", config)
			continue
		}
		configs = append(configs, cfg)
	}
	SendResponse(c, configs, "configs saved successfully", http.StatusCreated)
}

// UploadToGCS uploads an object to Google Cloud Storage
func UploadToGCS(file multipart.File, filename string, public bool) (string, error) {
	var empty string
	ctx := context.Background()
	_, objectAttributes, err := getGCSUploadAttribs(ctx, file, filename, public)
	if err != nil {
		switch err {
		case storage.ErrBucketNotExist:
			log.Errorf("storage bucket does not exist: %+v", err)
			return empty, err
		default:
			log.Errorf("failed to retrieve GCS object attrs: %+v", err)
			return empty, err
		}
	}
	// return fmt.Sprintf("https://storage.googleapis.com/%s/%s", objectAttributes.Bucket, objectAttributes.Name), nil
	return objectAttributes.Name, nil
}

// GetGCSSignedURL generates a signed url for an object
func GetGCSSignedURL(object string) (string, error) {
	location := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	if !strings.HasPrefix(location, "/") {
		cwd, _ := os.Getwd()
		location = cwd + "/" + location
	}
	jsonKey, err := ioutil.ReadFile(location)
	if err != nil {
		return "", fmt.Errorf("cannot read the JSON key file, err: %v", err)
	}

	conf, err := google.JWTConfigFromJSON(jsonKey)
	if err != nil {
		return "", fmt.Errorf("google.JWTConfigFromJSON: %v", err)
	}

	opts := &storage.SignedURLOptions{
		Method:         "GET",
		GoogleAccessID: conf.Email,
		PrivateKey:     conf.PrivateKey,
		Expires:        time.Now().Add(150 * time.Minute),
	}

	u, err := storage.SignedURL(os.Getenv("GC_STORAGE_BUCKET"), object, opts)
	if err != nil {
		return "", fmt.Errorf("Unable to generate a signed URL: %v", err)
	}
	return u, nil
}

func getGCSUploadAttribs(ctx context.Context, r io.Reader, filename string, public bool) (*storage.ObjectHandle, *storage.ObjectAttrs, error) {
	location := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	if !strings.HasPrefix(location, "/") {
		cwd, _ := os.Getwd()
		location = cwd + "/" + location
	}
	//client, err := storage.NewClient(ctx, option.WithCredentialsFile(os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")))
	client, err := storage.NewClient(ctx, option.WithCredentialsFile(location))
	if err != nil {
		return nil, nil, err
	}
	bucket := client.Bucket(os.Getenv("GC_STORAGE_BUCKET"))
	// check bucket exists
	if _, err = bucket.Attrs(ctx); err != nil {
		return nil, nil, err
	}
	// initialize file object
	object := bucket.Object(fmt.Sprintf("%s_%s", strings.ToLower(GenerateMemo()), filename))
	writer := object.NewWriter(ctx)
	if _, err := io.Copy(writer, r); err != nil {
		return nil, nil, err
	}
	if err := writer.Close(); err != nil {
		return nil, nil, err
	}
	// set Access Level on object
	if public {
		if err := object.ACL().Set(ctx, storage.AllUsers, storage.RoleReader); err != nil {
			return nil, nil, err
		}
	}
	// retrieve object attributes
	attrs, err := object.Attrs(ctx)
	return object, attrs, err
}

// StellarConfig represents the config returned from a stellar.toml file
type StellarConfig struct {
	FederationServer string `toml:"FEDERATION_SERVER"`
}

// FederationData represents the data returned from the federation server
type FederationData struct {
	AccountID      string `json:"account_id"`
	Memo           string `json:"memo"`
	MemoType       string `json:"memo_type"`
	StellarAddress string `json:"stellar_address"`
}

func RetrieveFederationData(federationAddress string) (*FederationData, error) {
	// get federation account source
	// address*example.com
	url := strings.Split(federationAddress, "*")[1]
	urlStr := fmt.Sprintf("http://%s/.well-known/stellar.toml", url)
	resp, err := http.Get(urlStr)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	// create file
	out, err := os.Create("stellar.toml")
	if err != nil {
		return nil, err
	}
	defer out.Close()
	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return nil, err
	}
	// parse config file
	cfg := StellarConfig{}
	_, err = toml.DecodeFile("stellar.toml", &cfg)
	if err != nil {
		return nil, err
	}
	accountData, err := getFederationAccountData(cfg.FederationServer, federationAddress)
	if err != nil {
		return nil, err
	}
	// accountData sample:
	/* map[
	account_id:GBTHLOH5QDMBL2J7RUVQQBEFHK7HB6UERE54XSABERJTXG4OURGEISVC
	memo:01DXY4Q1HNSBGWF4QQTKPZH3KN
	memo_type:text stellar_address:example@gmail.com*example.com
	]
	*/
	return accountData, nil
}

func getFederationAccountData(server, address string) (*FederationData, error) {

	// example:
	// https://FEDERATION_SERVER/?q=example*test.com&type=name
	url := fmt.Sprintf("%s?q=%s&type=name", server, address)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var out FederationData
	json.NewDecoder(resp.Body).Decode(&out)
	return &out, nil
}

func round(num float64) int {
	return int(num + math.Copysign(0.5, num))
}

// ToFixed formats a number using fixed-point notation
func ToFixed(num float64, precision int) float64 {
	output := math.Pow(10, float64(precision))
	return float64(round(num*output)) / output
}

// OffsetFromPage returns the DB offset cursor based on currently queried page
func OffsetFromPage(c *gin.Context, limit, currentPage, offset int) (int, int) {
	if c.Query("page") != "" {
		pg, _ := strconv.Atoi(c.Query("page"))
		return pg, (limit * (pg - 1))
	}
	return currentPage, offset
}
