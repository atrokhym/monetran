package routes

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/codehakase/monetran/api/custom/errorreporting"
	"github.com/codehakase/monetran/api/handlers/admin"
	"github.com/codehakase/monetran/api/handlers/transfer"
	"github.com/codehakase/monetran/api/handlers/user"
	"github.com/codehakase/monetran/api/handlers/wallet"
	log "github.com/codehakase/monetran/api/logger"
	"github.com/codehakase/monetran/api/utils"
	jwt "github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/context"
	"github.com/jinzhu/gorm"
)

var (
	DB *gorm.DB
)

type response struct {
	Status  string `json:"status"`
	Code    int    `json:"status_code"`
	Message string `json:"message"`
}

func Init(r *gin.Engine, db *gorm.DB, errorReporting errorreporting.Client) {
	setStates(db)
	log.SetState(errorReporting)
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	r.POST("/receive", transfer.ReceiveTransaction)
	r.GET("/federation", user.GetFederationData)
	r.POST("/adminify", admin.Adminify)
	api := r.Group("/api/v1")
	{
		// Auth
		api.POST("/auth", user.Auth)
		api.POST("/auth/signup", user.Register)
		api.GET("/auth/otp/:user_id", user.GenerateOTP)
		api.POST("/auth/otp", user.VerifyOTP)
		api.POST("/auth/verifyemail", user.VerifyEmail)
		api.POST("/auth/passwordreset", user.ResetPasswordRequest)
		api.POST("/auth/account/password/reset", user.ResetPassword)
		api.GET("/user/profile", useAuth(), user.GetProfile)
		api.POST("/user/profile", useAuth(), user.UpdateProfile)
		api.POST("/user/profile/upload", useAuth(), user.UploadImage)
		api.POST("/user/profile/image", useAuth(), user.UpdateImageUrl)
		api.POST("/user/profile/kyc", useAuth(), user.UploadKYCDoc)
		api.GET("/user/profile/trustdocs", useAuth(), user.TrustDocs)
		api.GET("/users/:id/objects/bank", useAuth(), user.GetBankDetails)

		// Transfers & Transactions
		api.GET("/transfers", useAuth(), transfer.GetTransfers)
		api.POST("/transfers", useAuth(), transfer.NewTransfer)
		api.GET("/transfers/p2p", useAuth(), transfer.GetP2PTransfers)
		api.POST("/transfers/p2p", useAuth(), transfer.NewP2PTransfer)
		api.GET("/transfers/recent", useAuth(), transfer.GetRecentTransfers)
		api.GET("/transfers/total", useAuth(), transfer.TotalP2PTransfers)

		// exchange rates
		api.GET("/rates/ngn", useAuth(), utils.GetNGNRate)

		// Withdrawals
		api.GET("/withdrawals", useAuth(), transfer.AnchorWithdrawals)
		api.GET("/withdrawals/:id", useAuth(), transfer.GetWithdrawal)
		api.POST("/withdrawals", useAuth(), transfer.NewAnchorWithdrawal)

		// Wallets
		api.POST("/wallets/activate", useAuth(), wallet.Activate)
		api.GET("/wallets", useAuth(), wallet.TotalFunded)
		api.GET("/user/wallets", useAuth(), wallet.UserWallets)
		api.GET("/wallets/transactions", useAuth(), wallet.Transactions)
		api.GET("/wallets/transactions/recent", useAuth(), wallet.RecentTransactions)

		// Topups
		api.GET("/wallet/:slug/payment_ref", useAuth(), wallet.GenerateACHPaymentReference)
		api.POST("/wallets/fund", useAuth(), wallet.Fund)
		api.GET("/wallets/ach_transfers", useAuth(), wallet.GetAchTransfers)
		api.POST("/wallets/ach_transfers/save_request", useAuth(), wallet.SaveACHTransferRequest)

		// Third party
		api.POST("/ext/stripe/charge", useAuth(), wallet.Charge)
		api.POST("/ext/gc/objecturl", useAuth(), user.RetrieveGCSObject)

		// configs
		api.GET("/configs/:type", useAuth(), func(c *gin.Context) {
			utils.RetrieveConfig(c, DB)
		})
		api.POST("/configs", useAuth(), func(c *gin.Context) {
			utils.SaveConfig(c, DB)
		})
		// Admin routes
		api.GET("/admin/overview/ach_transfers", useAuth(true), admin.RecentACHTransferRequests)
		api.GET("/admin/overview/kyc", useAuth(true), admin.RecentKYCUploads)
		api.GET("/admin/overview/withdrawals", useAuth(true), admin.RecentWithdrawals)

		api.GET("/admin/transfers", useAuth(true), admin.GetACHTransfers)
		api.GET("/admin/transfers/:id", useAuth(true), admin.GetACHTransfer)

		api.POST("/admin/topup/ach/:id", useAuth(true), admin.CreditACHUser)
		api.POST("/admin", useAuth(true), admin.Adminify)
		api.POST("/admin/settings", useAuth(true), admin.UpdateSettings)

		api.POST("/admin/ach/decline/:id", useAuth(true), admin.DeclineACHRequest)

		api.GET("/admin/kyc", useAuth(true), admin.KYCDocs)
		api.POST("/admin/kyc/approve/:id", useAuth(true), admin.ApproveKYC)
		api.POST("/admin/kyc/decline/:id", useAuth(true), admin.DeclineKYC)

		api.GET("/admin/withdrawals", useAuth(true), admin.Withdrawals)
		api.GET("/admin/withdrawals/:id", useAuth(true), admin.GetWithdrawal)
		api.POST("/admin/withdrawals/:id/approve", useAuth(true), admin.ApproveWithdrawal)
		api.POST("/admin/withdrawals/:id/decline", useAuth(true), admin.DeclineWithdrawal)
		api.GET("/admin/charges", useAuth(true), admin.GetChargedFees)

		api.POST("/admin/transfers/purge", useAuth(true), admin.PurgeInactiveACHRequests)
	}
}

func setStates(db *gorm.DB) {
	DB = db
	user.SetState(db)
	wallet.SetState(db)
	transfer.SetState(db)
	admin.SetState(db)
}

func useAuth(checkAdmin ...bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.Request.Header.Get("Authorization")
		if authHeader != "" {
			bearerToken := strings.Split(authHeader, " ")
			if len(bearerToken) == 2 {
				token, err := jwt.Parse(bearerToken[1], func(token *jwt.Token) (interface{}, error) {
					if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
						return nil, fmt.Errorf("there was an error")
					}
					return []byte(os.Getenv("API_SECRET")), nil
				})
				if err != nil {
					log.Errorf("failed to authenticate token: %v", err)
					c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
						"status":  "error",
						"message": err.Error() + ", Refresh the page by pressing F5",
					})
					return
				}
				if token.Valid {
					context.Set(c.Request, "decoded", token.Claims)
					if len(checkAdmin) > 0 {
						user, err := utils.UserFromAuth(DB, c)
						if err != nil {
							c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
								"status":  "error",
								"message": "Only admins can access this resource",
							})
						}
						if !user.IsAdmin {
							c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
								"status":  "error",
								"message": "Only admins can access this resource",
							})
						}
					}
					c.Next()
				} else {
					c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
						"status":  "error",
						"message": "Login session expired, login again",
					})
					return
				}
			} else {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
					"status":  "error",
					"message": "Not authorized, login again",
				})
				return
			}
		} else {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"status":  "error",
				"message": "Not authorized, login again",
			})
			return
		}
	}
}
