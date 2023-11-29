package errorreporting

import (
	"context"
	"log"
	"os"

	"cloud.google.com/go/errorreporting"
	"github.com/gin-gonic/gin"
)

// StackDriver represents an Error reporting client
type StackDriver struct {
	ServiceName string
	client      *errorreporting.Client
}

// NewClient creates a new StackDriver error reporting client
func NewClient() (*StackDriver, error) {
	ctx := context.Background()
	projectID := os.Getenv("GC_PROJECT_ID")
	client, err := errorreporting.NewClient(ctx, projectID, errorreporting.Config{
		ServiceName: "monetran",
		OnError: func(err error) {
			log.Printf("failed to initialize GC StackDriver client: %+v", err)
		},
	})
	if err != nil {
		log.Fatalf("failed to initialize GC StackDriver client.. %+v", err)
	}
	// defer client.Close()
	return &StackDriver{
		"monetran",
		client,
	}, nil
}

// WithHandler tells if a middleware is implemented
func (s *StackDriver) WithHandler() bool {
	return false
}

// Handler to trace requests up the stack on error
func (s *StackDriver) Handler() gin.HandlerFunc {
	return nil
}

// Notify dispatches an error to StackDriver notifiers
func (s *StackDriver) Notify(err error) {
	s.client.Report(errorreporting.Entry{
		Error: err,
	})
}
