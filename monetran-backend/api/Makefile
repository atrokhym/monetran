GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
BINARY_NAME=monetran
ARTIFACT_DIR=bin/
BUILD_PATH=cmd/monetran/main.go
ENV_FILE=cmd/monetran/.env
ARTIFACT_ZIP=monetran-api.tar.gz


all: test run

build:
		$(GOBUILD) -o $(BINARY_NAME) -ldflags="-s -w" $(BUILD_PATH)

test:
		$(GOTEST) -v ./...

clean:
		$(GOCLEAN)
		rm -f $(BINARY_NAME)
		rm $(ARTIFACT_DIR)$(ARTIFACT_ZIP)
		rm $(ARTIFACT_ZIP)

run:
		source $(ENV_FILE)
		$(GOBUILD) -o $(BINARY_NAME) $(BUILD_PATH)
		./$(BINARY_NAME)

deps:
		$(GOGET) -u ./...

# Cross platform compilation
build-linux:
	GOOS=linux GOARCH=amd64 $(GOBUILD) -o $(BINARY_NAME) -ldflags="-s -w" $(BUILD_PATH)

bundle: build-linux
	if [ ! -d $(ARTIFACT_DIR) ]; then mkdir $(ARTIFACT_DIR); fi
	if [ ! -d $(ARTIFACT_DIR)/email ]; then mkdir -p $(ARTIFACT_DIR)/email; fi
	cp -r $(ENV_FILE) $(ARTIFACT_DIR)
	cp Makefile $(ARTIFACT_DIR)
	cp email/templates/verifyemail.html $(ARTIFACT_DIR)/email/
	tar -zcvf $(ARTIFACT_ZIP) $(BINARY_NAME)
	cp $(ARTIFACT_ZIP) $(ARTIFACT_DIR)

unbundle:
	tar -zxvf $(ARTIFACT_ZIP)

docker:
	docker build -t -f Dockerfile.prod monetran/api .
