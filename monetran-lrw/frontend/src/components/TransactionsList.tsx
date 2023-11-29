// Copyright (c) The Diem Core Contributors
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useContext } from "react";
import { useTranslation } from "react-i18next";
import { settingsContext } from "../contexts/app";
import { Transaction, WyreTransaction } from "../interfaces/transaction";
import {
  fiatToDiemHumanFriendly,
  fiatFromDiemFloat,
  diemAmountToFloat,
  diemAmountToHumanFriendly,
} from "../utils/amount-precision";
import { classNames } from "../utils/class-names";
import { TFunction } from "i18next";

const STATUS_COLORS = {
  completed: "success",
  pending: "warning",
  canceled: "danger",
  locked: "primary",
};

interface TransactionsListProps {
  transactions: WyreTransaction[];
  onSelect?: (transaction: WyreTransaction) => void;
  bottom?: ReactElement;
}

function getStatusTitle(t: TFunction, transaction: WyreTransaction) {
  if (transaction.status === "locked") {
    return t("locked_status");
  }

  return t(transaction.direction);
}

function TransactionsList({ transactions, onSelect, bottom }: TransactionsListProps) {
  const { t } = useTranslation("transaction");
  const [settings] = useContext(settingsContext)!;

  const itemStyles = {
    "list-group-item": true,
    "list-group-item-action": !!onSelect,
    "cursor-pointer": !!onSelect,
  };

  const bottomStyles = {
    "list-group-item": true,
    "text-center": true,
  };

  return (
    <ul className="list-group my-4">
      {transactions.map((transaction) => {
        let sourceCurrency = settings.currencies[transaction.source_currency];
        if (!sourceCurrency) sourceCurrency = settings.fiatCurrencies[transaction.source_currency];
        let destCurrency = settings.currencies[transaction.dest_currency];
        if (!destCurrency) destCurrency = settings.fiatCurrencies[transaction.dest_currency];
        const fiatCurrency = settings.fiatCurrencies[settings.defaultFiatCurrencyCode!];
        //const exchangeRate = settings.defaultFiatCurrencyCode == sourceCurrency.name ? 1 : sourceCurrency.rates[settings.defaultFiatCurrencyCode!];
        const exchangeRate = sourceCurrency.rates[settings.defaultFiatCurrencyCode!] || fiatFromDiemFloat(1.0);
        //const exchangeRate = transaction.exchange_rate;        

        return (
          <li
            className={classNames(itemStyles)}
            key={transaction.id}
            onClick={() => onSelect && onSelect(transaction)}
          >
            <div className="d-flex">
              {transaction.direction === "received" && (
                <>
                  <span className="text-black mr-4 overflow-auto">
                    <strong className="text-capitalize-first">{t(transaction.direction)}</strong>{" "}
                    {t("from")} <span>{transaction.dest_name}</span>
                  </span>

                  <span className="text-black ml-auto text-nowrap">
                    {diemAmountToHumanFriendly(transaction.dest_amount, true)} {destCurrency.sign}
                  </span>
                </>
              )}

              {transaction.direction === "sent" && (
                <>
                  <span className="text-black mr-4 overflow-auto">
                    <strong className="text-capitalize-first">
                      {getStatusTitle(t, transaction)}
                    </strong>
                    {transaction.status !== "locked" && " " + t("to") + " "}
                    {transaction.status === "locked" && <br />}
                    <span>{transaction.source_name}</span>
                  </span>

                  <span className="text-black ml-auto text-nowrap">
                    - {diemAmountToHumanFriendly(transaction.source_amount, true)} {sourceCurrency.sign}
                  </span>
                </>
              )}
            </div>
            <div className="d-flex">
              <span className="small">
                <i className={`fa fa-circle text-${STATUS_COLORS[transaction.status]}`} />{" "}
                {new Date(transaction.timestamp).toLocaleDateString()}
              </span>
              <span className="small ml-auto">
                {fiatCurrency.sign}
                {fiatToDiemHumanFriendly(
                  diemAmountToFloat((transaction.direction === "sent") ? transaction.source_amount : transaction.dest_amount) * exchangeRate,
                  true
                )}{" "}
                {fiatCurrency.symbol}
              </span>
            </div>
          </li>
        );
      })}
      {bottom && <li className={classNames(bottomStyles)}>{bottom}</li>}
    </ul>
  );
}

export default TransactionsList;
