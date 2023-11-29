package log

import (
	"fmt"

	"github.com/codehakase/monetran/api/custom/errorreporting"
	l "github.com/sirupsen/logrus"
)

// Client represents the error reporting client
var Client errorreporting.Client

// SetState initializes runtime dependencies
func SetState(client errorreporting.Client) {
	Client = client
}

// Print logs a message at level Info on the standard logger.
func Print(args ...interface{}) {
	l.Print(args...)
}

// Info logs a message at level Info on the standard logger.
func Info(args ...interface{}) {
	l.Info(args...)
}

// Warn logs a message at level Warn on the standard logger.
func Warn(args ...interface{}) {
	l.Warn(args...)
}

// Warning logs a message at level Warn on the standard logger.
func Warning(args ...interface{}) {
	l.Warning(args...)
}

// Error logs a message at level Error on the standard logger.
func Error(args ...interface{}) {
	l.Error(args...)
}

// Panic logs a message at level Panic on the standard logger.
func Panic(args ...interface{}) {
	l.Panic(args...)
}

// Fatal logs a message at level Fatal on the standard logger.
func Fatal(args ...interface{}) {
	l.Fatal(args...)
}

// Printf logs a message at level Info on the standard logger.
func Printf(format string, args ...interface{}) {
	l.Printf(format, args...)
}

// Infof logs a message at level Info on the standard logger.
func Infof(format string, args ...interface{}) {
	l.Infof(format, args...)
}

// Errorf logs a message at level Error on the standard logger.
func Errorf(format string, args ...interface{}) {
	Client.Notify(fmt.Errorf(format, args...))
	l.Errorf(format, args...)
}

// Fatalf logs a message at level Fatal on the standard logger then the process will exit with status set to 1.
func Fatalf(format string, args ...interface{}) {
	Client.Notify(fmt.Errorf(format, args...))
	l.Fatalf(format, args...)
}

// Println logs a message at level Info on the standard logger.
func Println(args ...interface{}) {
	l.Println(args...)
}

// Fatalln logs a message at level Fatal on the standard logger then the process will exit with status set to 1.
func Fatalln(args ...interface{}) {
	l.Fatalln(args...)
}
