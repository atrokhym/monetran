package errorreporting

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

// Client represents an Interface to log errors to a third party or custom provider
type Client interface {
	WithHandler() bool
	Handler() gin.HandlerFunc
	Notify(err error)
}

// ClientFromEnv returns a client implementation base on set env config
func ClientFromEnv() Client {
	var client Client
	useclient := os.Getenv("ERROR_REPORTING_CLIENT")
	switch useclient {
	case "bugsnag":
		client = &Bugsnag{}
	case "stackdriver":
		sdclient, err := NewClient()
		if err != nil {
			log.Fatalf("cfevn: %+v", err)
		}
		client = sdclient
	default:
		client = &Bugsnag{}
	}
	return client
}
