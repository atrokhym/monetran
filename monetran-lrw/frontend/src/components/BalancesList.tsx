// Copyright (c) The Diem Core Contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from "react";
import { settingsContext } from "../contexts/app";
import { DiemCurrency } from "../interfaces/currencies";
import {
  fiatToDiemHumanFriendly,
  diemAmountToFloat,
  diemAmountToHumanFriendly,
} from "../utils/amount-precision";
import { CurrencyBalance } from "../interfaces/account";

interface BalancesListProps {
  balances: CurrencyBalance[];
  onSelect: (currency: DiemCurrency) => void;
}

function BalancesList({ balances, onSelect }: BalancesListProps) {
  const [settings] = useContext(settingsContext)!;

  const setActiveCurrency = (activeCurrency: DiemCurrency) => () => {
    onSelect(activeCurrency);
  };

  if (!settings.account) {
    return null;
  }

  return (
    <ul className="list-group">
      {balances.map((currencyBalance) => {
        let currency = settings.currencies[currencyBalance.currency];
        if (!currency) currency = settings.fiatCurrencies[currencyBalance.currency];

        const fiatCurrency = settings.fiatCurrencies[settings.defaultFiatCurrencyCode!];
        let exchangeRate = 1.0;
        let price = 0.0;
        if (currency.rates[settings.defaultFiatCurrencyCode!]) {
          exchangeRate = currency.rates[settings.defaultFiatCurrencyCode!];
          price = diemAmountToFloat(currencyBalance.balance) * exchangeRate;
        }
        else {
          exchangeRate = fiatCurrency.rates[currencyBalance.currency]!;
          price = currencyBalance.balance / diemAmountToFloat(exchangeRate);
        }

        return (
          <li
            className="list-group-item list-group-item-action d-flex align-items-center cursor-pointer"
            key={currencyBalance.currency}
            onClick={setActiveCurrency(currencyBalance.currency)}
          >
            <div className="mr-4">
              <strong className="ml-2 text-black">{currency.symbol}</strong>
            </div>
            <div className="ml-auto text-right">
              <div className="text-black">
                {diemAmountToHumanFriendly(currencyBalance.balance, true)} {currency.sign}
              </div>
              <div className="small">
                {fiatCurrency.sign}
                {fiatToDiemHumanFriendly(price, true)} {fiatCurrency.symbol}
              </div>
            </div>
          </li>
        );
      }).filter(Boolean)}
    </ul>
  );
}

export default BalancesList;
