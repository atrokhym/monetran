// Copyright (c) The Diem Core Contributors
// SPDX-License-Identifier: Apache-2.0

import { diemAmountToHumanFriendly } from "./amount-precision";
import { CurrencyBalance } from "../interfaces/account";
import { DiemCurrency, FiatCurrency } from "../interfaces/currencies";
import { CurrencySettings, FiatCurrencySettings } from "../interfaces/settings";
import { PaymentMethod } from "../interfaces/user";
import { TransactionDirection } from "../interfaces/transaction";

export function currenciesWithBalanceOptions(
  currencies: { [key in DiemCurrency]: CurrencySettings },
  balances: CurrencyBalance[]
): { [key in DiemCurrency]?: string } {
  return balances.reduce((options, balance) => {
    const currency = currencies[balance.currency];
    if (!currency) return options;
    const balanceAmount = diemAmountToHumanFriendly(balance.balance, true);
    options[balance.currency] = `${currency.name} (${balanceAmount} ${currency.sign} available)`;
    return options;
  }, {});
}

export function allCurrenciesWithBalanceOptions(
  currencies: { [key in DiemCurrency]: CurrencySettings },
  fiatCurrencies: { [key in FiatCurrency]: FiatCurrencySettings },
  balances: CurrencyBalance[]
): { [key in (DiemCurrency | FiatCurrency)]?: string } {
  return balances.reduce((options, balance) => {
    let currency = currencies[balance.currency];
    if (!currency) currency = fiatCurrencies[balance.currency];    
    //const currency = currencies[balance.currency];
    //if (!currency) return options;
    const balanceAmount = diemAmountToHumanFriendly(balance.balance, true);
    options[balance.currency] = `${currency.name} (${balanceAmount} ${currency.sign} available)`;
    return options;
  }, {});
}

export function getCurrenciesOptionsMap(
  currencies: { [key in DiemCurrency]: CurrencySettings }
): { [key in DiemCurrency]?: string } {
  return Object.keys(currencies).reduce((map, c) => {
    map[c] = currencies[c].name;
    return map;
  }, {});
}

export function fiatCurrenciesOptions(
  fiatCurrencies: { [key in FiatCurrency]: FiatCurrencySettings }
): { [key in FiatCurrency]?: string } {
  return Object.keys(fiatCurrencies).reduce((currencies, fiat) => {
    const currency = fiatCurrencies[fiat];
    currencies[fiat] = currency.symbol;
    return currencies;
  }, {});
}

export function allCurrenciesOptions(
  currencies: { [key in DiemCurrency | FiatCurrency]: CurrencySettings | FiatCurrencySettings},
): { [key in (DiemCurrency | FiatCurrency)]?: string } {
  return Object.keys(currencies).reduce((map, c) => {
    const currency = currencies[c];
    map[c] = currency.symbol;
    return map;
  }, {});
}

export function paymentMethodOptions(paymentMethods: PaymentMethod[]): { [key: number]: string } {
  return paymentMethods.reduce((paymentMethods, paymentMethod) => {
    paymentMethods[paymentMethod.id] = paymentMethod.name;
    return paymentMethods;
  }, {});
}

export function transactionDirectionsOptions(): { [key in TransactionDirection]: string } {
  return {
    received: "Incoming",
    sent: "Outgoing",
  };
}

export function transactionSortingOptions(): { [key: string]: string } {
  return {
    date_asc: "Newest to Oldest",
    date_desc: "Oldest to Newest",
    amount_desc: "Highest Amount",
    fiat_amount_desc: "Highest Fiat Amount",
    amount_asc: "Lowest Amount",
    fiat_amount_asc: "Lowest Fiat Amount",
  };
}
