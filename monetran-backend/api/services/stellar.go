package services

import (
	"errors"
	"fmt"
	"os"
	"strconv"

	log "github.com/codehakase/monetran/api/logger"
	"github.com/codehakase/monetran/api/utils"
	"github.com/stellar/go/build"
	"github.com/stellar/go/clients/horizon"
	"github.com/stellar/go/keypair"
)

var (
	client      *horizon.Client
	network     build.Network
	environment string
)

// InitializeUnits initializes all dependencies needed by the service
func InitializeUnits() error {
	environment = os.Getenv("ENV")
	switch environment {
	case "dev":
		client = horizon.DefaultTestNetClient
		network = build.TestNetwork
	case "prod":
		client = horizon.DefaultPublicNetClient
		network = build.PublicNetwork
	default:
		return errors.New("No environment is set, cannot initialize service [stellar_srv]")
	}
	return nil
}

// DistributionToAppWallet sends an asset transaction from the distribution wallet to the app wallet
func DistributionToAppWallet(amount float64, token, memo string) error {
	appPubKey := os.Getenv("WALLET_PUB_KEY")
	walletSecret := os.Getenv("DIST_SEC_KEY")
	// validate distribution keypair
	_, err := keypair.Parse(walletSecret)
	if err != nil {
		return err
	}
	isNative := (token == "XLM")
	paymentOp := returnPaymetOp(isNative, amount, token, appPubKey)
	err = sendToWallet(paymentOp, walletSecret, memo)
	if err != nil {
		return err
	}
	return nil
}

// AppToDistributionWallet sends an asset transaction from the app wallet to the distribution wallet
func AppToDistributionWallet(amount float64, token, memo string) error {
	appSecret := os.Getenv("WALLET_SEC_KEY")
	distributionSource := os.Getenv("DIST_PUB_KEY")
	// validate keypair
	_, err := keypair.Parse(appSecret)
	if err != nil {
		return err
	}
	isNative := (token == "XLM")
	paymentOp := returnPaymetOp(isNative, amount, token, distributionSource)
	err = sendToWallet(paymentOp, appSecret, memo)
	if err != nil {
		return err
	}
	return nil
}

func sendToWallet(paymentOp build.PaymentBuilder, source, memo string) error {
	txt, err := build.Transaction(
		build.SourceAccount{AddressOrSeed: source},
		network,
		build.AutoSequence{SequenceProvider: client},
		paymentOp,
		build.MemoText{Value: memo},
	)
	if err != nil {
		return err
	}
	txe, err := txt.Sign(source)
	if err != nil {
		return err
	}
	hash, err := txe.Base64()
	if err != nil {
		return err
	}
	resp, err := client.SubmitTransaction(hash)
	if err != nil {
		if err != nil {
			switch e := err.(type) {
			case *horizon.Error:
				fmt.Println("err type=" + e.Problem.Type)
				fmt.Println("err detailed=" + e.Problem.Detail)
				fmt.Println("err extras=" + string(e.Problem.Extras["result_codes"]))
			}
			return err
		}
	}
	log.Infof("[DistributionToAppWallet Request complete]: \nhash: %+v", resp.TransactionSuccessToString())
	return nil
}

func returnPaymetOp(isNative bool, amount float64, token, recipient string) build.PaymentBuilder {
	if !isNative {
		return build.Payment(
			build.Destination{AddressOrSeed: recipient},
			build.CreditAmount{
				Amount: strconv.FormatFloat(utils.ToFixed(amount, 7), 'g', -1, 64),
				Code:   token,
				Issuer: getAssetIssuer(token),
			},
		)
	}
	return build.Payment(
		build.Destination{AddressOrSeed: recipient},
		build.NativeAmount{Amount: strconv.FormatFloat(utils.ToFixed(amount, 7), 'g', -1, 64)},
	)
}

func getAssetIssuer(code string) string {
	if code == "MNDA" {
		return os.Getenv("MNDA_ASSET_ISSUER")
	}
	return "" //TODO: extend for other wallet issuers
}
