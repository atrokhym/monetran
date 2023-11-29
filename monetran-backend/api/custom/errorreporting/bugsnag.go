package errorreporting

import (
	"os"

	"github.com/bugsnag/bugsnag-go"
	bugsnaggin "github.com/bugsnag/bugsnag-go/gin"
	"github.com/gin-gonic/gin"
)

// Bugsnag represents a Bugsnag reporting client
type Bugsnag struct {
}

// WithHandler tells if a middleware is implemented
func (b *Bugsnag) WithHandler() bool {
	return true
}

// Handler to trace requests up the stack on error
func (b *Bugsnag) Handler() gin.HandlerFunc {
	return bugsnaggin.AutoNotify(bugsnag.Configuration{
		APIKey:          os.Getenv("BUGSNAG_API_KEY"),
		AppVersion:      "0.30.0",
		ReleaseStage:    os.Getenv("ENV"),
		ProjectPackages: []string{"main", "github.com/codehakase/monetran/api"},
	})
}

// Notify dispatches an error to Bugsnag's configured notifiers
func (b *Bugsnag) Notify(err error) {
	bugsnag.Notify(err)
}
