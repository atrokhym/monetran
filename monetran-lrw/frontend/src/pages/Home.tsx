// Copyright (c) The Diem Core Contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext, useEffect, useState } from "react";
import { Container } from "reactstrap";
import { Redirect } from "react-router";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { settingsContext } from "../contexts/app";
import { DiemCurrency } from "../interfaces/currencies";
import { RegistrationStatus } from "../interfaces/user";
import { Transaction, WyreTransaction } from "../interfaces/transaction";
import VerifyingMessage from "../components/VerifyingMessage";
import TotalBalance from "../components/TotalBalance";
import Actions from "../components/Actions";
import BalancesList from "../components/BalancesList";
import SendModal from "../components/Send/SendModal";
import ReceiveModal from "../components/ReceiveModal";
import TransferModal from "../components/TransferModal";
import WalletLoader from "../components/WalletLoader";
import TransactionsList from "../components/TransactionsList";
import BackendClient from "../services/backendClient";
import TransactionModal from "../components/TransactionModal";
import TestnetWarning from "../components/TestnetWarning";
import PaymentConfirmation from "../components/PaymentConfirmation";
import FundsPullPreApprovalsList from "../components/FundsPullPreApproval/FundsPullPreApprovalsList";
import { Approval } from "../interfaces/approval";
import moment from "moment";
import { FiatCurrency } from "../../src/interfaces/currencies";

const REFRESH_TRANSACTIONS_INTERVAL = 30000;
const REFRESH_APPROVALS_INTERVAL = 30000;

function Home() {
  const { t } = useTranslation("layout");
  const [settings] = useContext(settingsContext)!;
  const user = settings.user;

  const userVerificationRequired =
    user &&
    [RegistrationStatus.Registered, RegistrationStatus.Verified].includes(
      user.registration_status as RegistrationStatus
    );

  const [activeCurrency, setActiveCurrency] = useState<DiemCurrency | undefined>();
  const [transactions, setTransactions] = useState<WyreTransaction[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [transactionModal, setTransactionModal] = useState<WyreTransaction>();

  const [transferModalOpen, setTransferModalOpen] = useState<boolean>(false);
  const [sendModalOpen, setSendModalOpen] = useState<boolean>(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState<boolean>(false);
  const [redirectToVerification, setRedirectToVerification] = useState<boolean>(false);

  useEffect(() => {
    const registerDemoUser = async () => {
      try {
        if (settings.user?.username === "demo_customer@diem.com") {
          if (userVerificationRequired) {
            const usdValue: FiatCurrency = "USD";
            const userInfo = {
              selected_fiat_currency: usdValue,
              selected_language: "en",
              first_name: "Demo",
              last_name: "User",
              dob: moment(new Date(2018, 10, 10, 10, 10, 30, 0)),
              phone: "1 123-456-7890",
              country: "US",
              state: "California",
              city: "San Francisco",
              address_1: "58 Middle Point Rd",
              address_2: "",
              zip: "94124",
            };

            const user = await new BackendClient().updateUserInfo(userInfo);
          }
        } else {
          if (userVerificationRequired) {
            setRedirectToVerification(true);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    registerDemoUser();
  }, [userVerificationRequired]);

  useEffect(() => {
    async function refreshUser() {
      try {
        await new BackendClient().refreshUser();
      } catch (e) {
        console.error(e);
      }
    }
    // noinspection JSIgnoredPromiseFromCall
    refreshUser();
  }, []);

  let refreshTransactions = true;

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (refreshTransactions) {
          setTransactions(
            await new BackendClient().getTransactions(undefined, undefined, undefined, 10)
          );
          setTimeout(fetchTransactions, REFRESH_TRANSACTIONS_INTERVAL);
        }
      } catch (e) {
        console.error(e);
      }
    };

    // noinspection JSIgnoredPromiseFromCall
    fetchTransactions();

    return () => {
      refreshTransactions = false;
    };
  }, [setTransactions]);

  let refreshApprovals = true;

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        if (refreshApprovals) {
          setApprovals(await new BackendClient().getNewFundsPullPreApprovals());
        }
        setTimeout(fetchApprovals, REFRESH_APPROVALS_INTERVAL);
      } catch (e) {
        console.error(e);
      }
    };

    // noinspection JSIgnoredPromiseFromCall
    fetchApprovals();

    return () => {
      refreshApprovals = false;
    };
  }, [setApprovals]);

  if (!user) {
    return <WalletLoader />;
  }

  return (
    <>
      {redirectToVerification && <Redirect to="/verify" />}
      {!!activeCurrency && <Redirect to={"/account/" + activeCurrency} />}
      <TestnetWarning />

      <Container className="py-5">
        {user.registration_status !== "Approved" ? (
          <VerifyingMessage />
        ) : (
          <>
            <PaymentConfirmation />

            <h1 className="h5 font-weight-normal text-body text-center">
              {user.first_name} {user.last_name}
            </h1>

            <section className="my-5 text-center">
              <TotalBalance />
            </section>

            <section className="my-5 text-center">
              <Actions
                onSendClick={() => setSendModalOpen(true)}
                onRequestClick={() => setReceiveModalOpen(true)}
                onTransferClick={() => setTransferModalOpen(true)}
              />
            </section>

            {!settings.paymentMethods?.length && (
              <section>
                <div className="my-2">
                  <span>{t("no_payment_methods.title")}</span>,{" "}
                  <Link to="/settings">{t("no_payment_methods.button")}</Link>.
                  <i className="fa fa-money-check" />
                </div>
              </section>
            )}

            <section className="my-5">
              <h2 className="h5 font-weight-normal text-body">{t("balances")}</h2>
              <BalancesList balances={settings.account?.balances!} onSelect={setActiveCurrency} />
            </section>

            {!!transactions.length && (
              <section className="my-5">
                <h2 className="h5 font-weight-normal text-body">{t("transactions")}</h2>
                <TransactionsList
                  transactions={transactions}
                  bottom={
                    <Link to="/transactions" className="text-black font-weight-bold">
                      {t("all_transactions_link")}
                    </Link>
                  }
                  onSelect={(transaction) => {
                    setTransactionModal(transaction);
                  }}
                />
                <TransactionModal
                  open={!!transactionModal}
                  onClose={() => setTransactionModal(undefined)}
                  transaction={transactionModal}
                />
              </section>
            )}

            <section className="my-5">
              <h2 className="h5 font-weight-normal text-body">{t("approvals")}</h2>
              <ul className="list-group my-4">
                <FundsPullPreApprovalsList approvals={approvals} disableRevokeButton />
                <li className="list-group-item text-center">
                  <Link to="/fundsPullPreApprovals" className="text-black font-weight-bold">
                    {t("all_approvals")}
                  </Link>
                </li>
              </ul>
            </section>

            <SendModal open={sendModalOpen} onClose={() => setSendModalOpen(false)} />
            <ReceiveModal open={receiveModalOpen} onClose={() => setReceiveModalOpen(false)} />
            <TransferModal open={transferModalOpen} onClose={() => setTransferModalOpen(false)} />
          </>
        )}
      </Container>
    </>
  );
}

export default Home;
