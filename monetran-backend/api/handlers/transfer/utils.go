// custom util methods for monetran/transfer package
package transfer

import (
	"os"
	"strconv"

	"github.com/stellar/go/build"
)

func returnPaymentOp(native bool, amount float64, code, recipient string) build.PaymentBuilder {
	if !native {
		return build.Payment(
			build.Destination{AddressOrSeed: recipient},
			build.CreditAmount{
				Amount: strconv.FormatFloat(amount, 'g', -1, 64),
				Code:   code,
				Issuer: getAssetIssuer(code),
			},
		)
	}
	return build.Payment(
		build.Destination{AddressOrSeed: recipient},
		build.NativeAmount{Amount: strconv.FormatFloat(amount, 'g', -1, 64)},
	)
}

func getAssetIssuer(code string) string {
	if code == "MNDA" {
		return os.Getenv("MNDA_ASSET_ISSUER")
	}
	return "" //TODO: extend for other wallet issuers
}
