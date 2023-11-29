// Copyright (c) The Diem Core Contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from "react";
import { Modal, ModalBody } from "reactstrap";
import { useTranslation } from "react-i18next";
import { settingsContext } from "../contexts/app";
import ExplorerLink from "./ExplorerLink";
import { Transaction, WyreTransaction } from "../interfaces/transaction";
import CloseButton from "./CloseButton";
import {
  fiatToDiemHumanFriendly,
  fiatFromDiemFloat,
  diemAmountToFloat,
  diemAmountToHumanFriendly,
} from "../utils/amount-precision";

const STATUS_COLORS = {
  completed: "success",
  pending: "warning",
  canceled: "danger",
};

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  transaction?: WyreTransaction;
}

function TransactionModal({ open, onClose, transaction }: TransactionModalProps) {
  const { t } = useTranslation("transaction");

  const [settings] = useContext(settingsContext)!;

  if (!transaction) {
    return null;
  }

  let sourceCurrency = settings.currencies[transaction.source_currency];
  if (!sourceCurrency) sourceCurrency = settings.fiatCurrencies[transaction.source_currency];
  let destCurrency = settings.currencies[transaction.dest_currency];
  if (!destCurrency) destCurrency = settings.fiatCurrencies[transaction.dest_currency];

  const fiatCurrency = settings.fiatCurrencies[settings.defaultFiatCurrencyCode!];

  const exchangeRate = sourceCurrency.rates[settings.defaultFiatCurrencyCode!] || fiatFromDiemFloat(1.0);
  //const exchangeRate = transaction.exchange_rate;        

  return (
    <Modal className="modal-dialog-centered" isOpen={open} onClosed={onClose}>
      <ModalBody>
        <CloseButton onClick={onClose} />

        {transaction.direction === "sent" && (
          <div className="text-center">
            <div className="h2 text-capitalize-first">{t(transaction.direction)}</div>

            <h2 className="h2 m-0">
              {diemAmountToHumanFriendly(transaction.source_amount, true)} {sourceCurrency.sign}
            </h2>

            <div>
              {t("price")} {fiatCurrency.sign}
              {fiatToDiemHumanFriendly(
                diemAmountToFloat(transaction.source_amount) * exchangeRate,
                true
              )}{" "}
              {fiatCurrency.symbol}
            </div>
          </div>
        )}
        {transaction.direction === "received" && (
          <div className="text-center">
            <div className="h2 text-capitalize-first">{t(transaction.direction)}</div>

            <h2 className="h2 m-0">
              {diemAmountToHumanFriendly(transaction.dest_amount, true)} {destCurrency.sign}
            </h2>

            <div>
              {t("price")} {fiatCurrency.sign}
              {fiatToDiemHumanFriendly(
                diemAmountToFloat(transaction.dest_amount) * exchangeRate,
                true
              )}{" "}
              {fiatCurrency.symbol}
            </div>
          </div>
        )}

        <div className="mt-4">
          {t("date")}
          <div className="text-black">{new Date(transaction.timestamp).toLocaleString()}</div>
        </div>

        {transaction.direction === "sent" && (
          <div className="mt-4">
            {t("sent_to")}
            <div>
              <span className="text-black" title={transaction.dest_name}>
                {transaction.dest_name}
              </span>
            </div>

            <br></br>            
            {t("total")}
            <div>
              <span className="text-black">
                {diemAmountToHumanFriendly(transaction.dest_amount, true)} {destCurrency.sign}
              </span>
            </div>
          </div>
        )}
        {transaction.direction === "received" && (
          <div className="mt-4">
            {t("sent_from")}
            <div>
              <span className="text-black" title={transaction.source_name}>
                {transaction.source_name}
              </span>
            </div>

            <br></br>            
            {t("total")}
            <div>
              <span className="text-black">
                {diemAmountToHumanFriendly(transaction.source_amount, true)} {sourceCurrency.sign}
              </span>
            </div>
          </div>
        )}

        {transaction.fees && (
          <div className="mt-4">
            {t("fees")}
            <div>
              <span className="text-black">
                {diemAmountToHumanFriendly(transaction.fees, true)} {sourceCurrency.sign}
              </span>
            </div>
          </div>
        )}

        {transaction.exchange_rate && (
          <div className="mt-4">
            {t("rate")}
            <div>
              <span className="text-black">
                {transaction.exchange_rate.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4">
          {t("status")}
          <div>
            <i className={`fa fa-circle text-${STATUS_COLORS[transaction.status]}`} />{" "}
            <span className="text-black text-capitalize" title={transaction.status}>
              {transaction.status}
            </span>
          </div>
        </div>

        <div className="mt-4">
          {t("tx_id")}
          <div>
            <span className="text-black text-capitalize">{transaction.id}</span>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}

export default TransactionModal;
