package middleware

import (
	"encoding/json"
	"fmt"

	"github.com/codehakase/monetran/api/models"
)

const (
	MINTS  = 10000
	MONEDA = 100 * MINTS
)

// MNDA represents the base unit => 1/10,000th of a mint.
type MNDA int64

// Moneda returns the user readable currency format
func (m MNDA) Moneda() float64 {
	return float64(m) / MONEDA
}

// Mints returns the fractional currency value of Moneda
func (m MNDA) Mints() float64 {
	return float64(m) / MINTS
}

// ToMints creates a safe representation of MNDA in Mints
func ToMints(d float64) MNDA {
	return MNDA(d * MONEDA)
}

// String returns the string representation of Moneda
func (m MNDA) String() string {
	return fmt.Sprintf("%.4f", m.Moneda())
}

// Int64 returns the pure int64 representation of MNDA
func (m MNDA) Int64() int64 {
	return int64(m)
}

// FormatPayload takes a models.Transfer collection and apply some
// formatting to it
func FormatPayload(data interface{}) (interface{}, error) {
	switch data.(type) {
	case models.Wallet:
		return formatWallet(data.(models.Wallet))
	case models.AnchorWithdrawal:
		return formatWithdrawal(data.(models.AnchorWithdrawal))
	case models.ACHTransferRequest:
		return formatACHTransfer(data.(models.ACHTransferRequest))
	case []models.WalletTransaction:
		return formatWalletTransactions(data.([]models.WalletTransaction))
	case []models.ACHTransferRequest:
		return formatACHTransfers(data.([]models.ACHTransferRequest))
	case []models.AnchorWithdrawal:
		return formatWithdrawals(data.([]models.AnchorWithdrawal))
	case []models.P2PTransfer:
		return formatP2PTransfers(data.([]models.P2PTransfer))
	}
	return nil, nil
}

func formatWalletTransactions(transactions []models.WalletTransaction) (interface{}, error) {
	formatted := make([]map[string]interface{}, 0)
	for _, item := range transactions {
		var cpy map[string]interface{}
		// cpy model struct to cpy var
		b, err := json.Marshal(&item)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(b, &cpy)
		if err != nil {
			return nil, err
		}
		// mutate amount field, retrieve currency representation
		cpy["amount"] = MNDA(item.CalculatedItem()).Moneda()
		formatted = append(formatted, cpy)
	}
	return formatted, nil
}

func formatWallet(wallet models.Wallet) (interface{}, error) {
	var cpy map[string]interface{}
	// cpy model struct to cpy var
	b, err := json.Marshal(&wallet)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(b, &cpy)
	if err != nil {
		return nil, err
	}
	// mutate amount field, retrieve currency representation
	cpy["balance"] = MNDA(wallet.CalculatedItem()).Moneda()
	return cpy, nil
}

func formatACHTransfer(transfer models.ACHTransferRequest) (interface{}, error) {
	var cpy map[string]interface{}
	// cpy model struct to cpy var
	b, err := json.Marshal(&transfer)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(b, &cpy)
	if err != nil {
		return nil, err
	}
	// mutate amount field, retrieve currency representation
	cpy["amount"] = MNDA(transfer.CalculatedItem()).Moneda()
	return cpy, nil
}

func formatWithdrawal(withdrawal models.AnchorWithdrawal) (interface{}, error) {
	var cpy map[string]interface{}
	// cpy model struct to cpy var
	b, err := json.Marshal(&withdrawal)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(b, &cpy)
	if err != nil {
		return nil, err
	}
	// mutate amount field, retrieve currency representation
	cpy["amount"] = MNDA(withdrawal.CalculatedItem()).Moneda()
	return cpy, nil
}

func formatACHTransfers(transfers []models.ACHTransferRequest) (interface{}, error) {
	formatted := make([]map[string]interface{}, 0)
	for _, item := range transfers {
		var cpy map[string]interface{}
		// cpy model struct to cpy var
		b, err := json.Marshal(&item)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(b, &cpy)
		if err != nil {
			return nil, err
		}
		// mutate amount field, retrieve currency representation
		cpy["amount"] = MNDA(item.CalculatedItem()).Moneda()
		formatted = append(formatted, cpy)
	}
	return formatted, nil
}

func formatWithdrawals(withdrawals []models.AnchorWithdrawal) (interface{}, error) {
	formatted := make([]map[string]interface{}, 0)
	for _, item := range withdrawals {
		var cpy map[string]interface{}
		// cpy model struct to cpy var
		b, err := json.Marshal(&item)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(b, &cpy)
		if err != nil {
			return nil, err
		}
		// mutate amount field, retrieve currency representation
		cpy["amount"] = MNDA(item.CalculatedItem()).Moneda()
		formatted = append(formatted, cpy)
	}
	return formatted, nil
}

func formatP2PTransfers(transfers []models.P2PTransfer) (interface{}, error) {
	formatted := make([]map[string]interface{}, 0)
	for _, item := range transfers {
		var cpy map[string]interface{}
		// cpy model struct to cpy var
		b, err := json.Marshal(&item)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(b, &cpy)
		if err != nil {
			return nil, err
		}
		// mutate amount field, retrieve currency representation
		cpy["amount"] = MNDA(item.CalculatedItem()).Moneda()
		formatted = append(formatted, cpy)
	}
	return formatted, nil
}
