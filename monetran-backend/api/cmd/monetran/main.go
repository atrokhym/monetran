package main

import (
	"errors"
	"fmt"
	"os"

	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"

	"github.com/codehakase/monetran/api/custom/errorreporting"
	. "github.com/codehakase/monetran/api/models"
	"github.com/codehakase/monetran/api/routes"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
	"github.com/joho/godotenv"
)

func main() {

	err := godotenv.Load()
	if err != nil {
		log.Error("Error loading .env file")
	}

	dbstring := fmt.Sprintf("%s:%s", os.Getenv("DB_HOST"), os.Getenv("DB_PORT"))
	db, err := dbFromType(dbstring)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	db.LogMode(true)
	log.Println("[RUN] Auto Migration")
	Migrate(db)
	r := gin.Default()
	// Register the error reporting client handler(s) if any
	errReporting := errorreporting.ClientFromEnv()
	if errReporting.WithHandler() {
		r.Use(errReporting.Handler())
	}
	r.Use(CORS())
	r.Use(static.Serve("/", static.LocalFile(os.Getenv("APP_BUILD_DIR"), true)))
	routes.Init(r, db, errReporting)
	log.Println("starting server on port ", os.Getenv("PORT"))
	r.Run(fmt.Sprintf(":%s", (os.Getenv("PORT"))))
}

func setContentTypeMiddleware(c *gin.Context) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Add("Content-Type", "application/json")
		c.Next()
	}
}
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Add("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, UPDATE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(200)
		} else {
			c.Next()
		}
	}
}

func dbFromType(dbstr string) (*gorm.DB, error) {
	dbtype := os.Getenv("DB_TYPE")
	switch dbtype {
	case "mysql":
		return gorm.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s)/monetran?charset=utf8&parseTime=True&loc=Local", os.Getenv("DB_USER"), os.Getenv("DB_PASS"), dbstr))
	case "postgres":
		return gorm.Open("postgres", fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_USER"), os.Getenv("DB_PASS"), os.Getenv("DB_NAME")))
	}
	return nil, errors.New("invalid database type detected")
}
