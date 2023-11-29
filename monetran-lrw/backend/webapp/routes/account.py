# pyre-ignore-all-errors

# Copyright (c) The Diem Core Contributors
# SPDX-License-Identifier: Apache-2.0

#import datetime as DT
from datetime import datetime
from itertools import chain
from http import HTTPStatus
from locale import currency
from typing import Dict

from flask import request, Blueprint
import context

from diem_utils.precise_amount import Amount
from diem import identifier, utils
from diem_utils.types.currencies import Currencies, DiemCurrency, FiatCurrency
from diem_utils.types.liquidity.currency import Currency, CurrencyPair, CurrencyPairs
from wallet.services import account as account_service
from wallet.services import user as user_service
from wallet.services import transaction as transaction_service
from wallet.services.transaction import get_transaction_direction, FundsTransfer
from wallet.storage import Transaction
from wallet.types import TransactionStatus, TransactionType, TransactionDirection, TransactionSortOption
from webapp.routes.offchain.p2p_payment import payment_command_to_dict
from webapp.routes.strict_schema_view import (
    response_definition,
    path_string_param,
    query_str_param,
    body_parameter,
    StrictSchemaView,
    query_int_param,
)
from webapp.schemas import (
    AccountTransactions as AccountTransactionsSchema,
    WyreAccountTransactions as WyreAccountTransactionsSchema,
    CreateTransaction,
    Balances as AccountInfoSchema,
    FullAddress as FullAddressSchema,
    Error,
    TransactionId,
    FundsTransfer as FundsTransferSchema,
)
from wallet.services.wyre import (
    WyreApi,
    WyreError,
)

account = Blueprint("account/v1", __name__, url_prefix="/")


class AccountRoutes:
    class AccountView(StrictSchemaView):
        tags = ["Account"]

    class AccountInfo(AccountView):
        summary = "Get an account info"
        parameters = []
        responses = {
            HTTPStatus.OK: response_definition(
                "Account information", schema=AccountInfoSchema
            ),
            HTTPStatus.FORBIDDEN: response_definition("Unauthorized", schema=Error),
        }

        def get(self):
            user = self.user
            if user.account is None:  # no account created yet
                return {"balances": []}, HTTPStatus.OK
            account_name = user.account.name

            wyre_wallet_id = user.wyre_wallet_id
            wyre_user_id = user.wyre_user_id

            if not account_service.is_user_allowed_for_account(
                user=user, account_name=account_name
            ):
                return self.respond_with_error(
                    HTTPStatus.FORBIDDEN, "User is forbidden for account"
                )

            if wyre_user_id and wyre_wallet_id:
                balances = account_service.get_account_balance_by_wyre_wallet(
                    wyre_wallet_id, wyre_user_id
                )

            else:
                balances = account_service.get_account_balance_by_name(
                    account_name=account_name
                )

            account_info = {
                "balances": [
                    dict(currency=currency.value, balance=balance)
                    for currency, balance in balances.total.items()
                ]
            }

            return account_info, HTTPStatus.OK

    class GetSingleTransaction(AccountView):
        summary = "Get a single transaction"
        parameters = [
            path_string_param(name="transaction_id", description="transaction id")
        ]
        responses = {
            HTTPStatus.OK: response_definition(
                "A single transaction", schema=FundsTransferSchema
            ),
            HTTPStatus.NOT_FOUND: response_definition(
                "Transaction not found", schema=Error
            ),
        }

        def get(self, transaction_id: str):
            user = self.user
            account_id = user.account_id
            funds_transfer = transaction_service.get_funds_transfer(
                reference_id=transaction_id
            )
            if (
                funds_transfer.transaction is None
                and funds_transfer.payment_command is None
            ):
                return self.respond_with_error(
                    HTTPStatus.NOT_FOUND,
                    f"Funds transfer details for reference id {transaction_id} was not found.",
                )

            if funds_transfer.transaction and not (
                funds_transfer.transaction.source_id == account_id
                or funds_transfer.transaction.destination_id == account_id
            ):
                return self.respond_with_error(
                    HTTPStatus.NOT_FOUND,
                    f"Transaction id {transaction_id} was not found.",
                )

            funds_transfer = AccountRoutes.get_funds_transfer_response_object(
                user.account_id, funds_transfer
            )

            return funds_transfer, HTTPStatus.OK

    class GetAllTransactions(AccountView):
        summary = "Get an account transactions"
        parameters = [
            query_str_param(
                name="currency",
                description="currency name",
                required=False,
                allowed_vlaues=chain(list(FiatCurrency.__members__), list(DiemCurrency.__members__)),
            ),
            query_str_param(
                name="direction",
                description="transaction direction",
                required=False,
                allowed_vlaues=["sent", "received"],
            ),
            query_int_param(
                name="limit",
                description="Limin amount of transactions to fetch",
                required=False,
            ),
            query_str_param(
                name="sort",
                description="sort transactions by a requested filter",
                required=False,
                allowed_vlaues=[
                    "date_asc",
                    "date_desc",
                    "diem_amount_desc",
                    "diem_amount_asc",
                    "fiat_amount_desc",
                    "fiat_amount_asc",
                ],
            ),
        ]
        responses = {
            HTTPStatus.OK: response_definition(
                "Account transactions", schema=AccountTransactionsSchema
            ),
        }

        def get(self):
            currency, direction, limit, sort_option = self.get_request_params()

            user = self.user

            if user.account is None:
                return {"transaction_list": []}, HTTPStatus.OK

            account_name = user.account.name

            transactions = account_service.get_account_transactions(
                account_name=account_name,
                currency=currency,
                direction_filter=direction,
                limit=limit,
                sort=sort_option,
            )
            transaction_list = [
                AccountRoutes.get_transaction_response_object(user.account_id, tx)
                for tx in transactions
            ]

            return {"transaction_list": transaction_list}, HTTPStatus.OK

        @staticmethod
        def get_request_params():
            currency = (
                DiemCurrency(request.args["currency"])
                if "currency" in request.args
                else None
            )
            direction = (
                TransactionDirection(request.args["direction"])
                if "direction" in request.args
                else None
            )
            limit = int(request.args["limit"]) if "limit" in request.args else None
            sort_option = (
                TransactionSortOption(request.args["sort"])
                if "sort" in request.args
                else None
            )

            return currency, direction, limit, sort_option


    class GetWyreTransactions(AccountView):
        summary = "Get an account wyre transactions"
        parameters = [
            query_str_param(
                name="currency",
                description="currency name",
                required=False,
                allowed_vlaues=chain(list(FiatCurrency.__members__), list(DiemCurrency.__members__)),
            ),
            query_str_param(
                name="direction",
                description="transaction direction",
                required=False,
                allowed_vlaues=["sent", "received"],
            ),
            query_int_param(
                name="limit",
                description="Limin amount of transactions to fetch",
                required=False,
            ),
            query_str_param(
                name="sort",
                description="sort transactions by a requested filter",
                required=False,
                allowed_vlaues=[
                    "date_asc",
                    "date_desc",
                    "diem_amount_desc",
                    "diem_amount_asc",
                    "fiat_amount_desc",
                    "fiat_amount_asc",
                ],
            ),
        ]
        responses = {
            HTTPStatus.OK: response_definition(
                "Account transactions", schema=WyreAccountTransactionsSchema
            ),
        }

        def get(self):
            currency, direction, limit, sort_option = self.get_request_params()

            user = self.user

            if (user.wyre_wallet_id is None
                    or user.wyre_user_id is None):
                return {"transaction_list": []}, HTTPStatus.OK

            api = WyreApi()
            response = api.getWalletTransfers(
                "wallet:" + user.wyre_wallet_id,
                user.wyre_user_id
            )

            if response:
                transactions = response["data"]
                transaction_list = [
                    AccountRoutes.get_wyre_transaction_response_object(tx)
                    for tx in transactions
                ]

                transaction_filtered = [
                    {k: v for k, v in v_i.items() if v is not None}
                    for v_i in transaction_list
                ]
                return {"transaction_list": transaction_filtered}, HTTPStatus.OK

            else:
                return {"transaction_list": []}, HTTPStatus.OK

        @staticmethod
        def get_request_params():
            currency = (
                DiemCurrency(request.args["currency"])
                if "currency" in request.args
                else None
            )
            direction = (
                TransactionDirection(request.args["direction"])
                if "direction" in request.args
                else None
            )
            limit = int(request.args["limit"]) if "limit" in request.args else None
            sort_option = (
                TransactionSortOption(request.args["sort"])
                if "sort" in request.args
                else None
            )

            return currency, direction, limit, sort_option


    class SendTransaction(AccountView):
        summary = "Send a transaction"
        parameters = [body_parameter(CreateTransaction)]
        responses = {
            HTTPStatus.OK: response_definition(
                "Created transaction", schema=TransactionId
            ),
            HTTPStatus.FAILED_DEPENDENCY: response_definition(
                "Risk check failed", Error
            ),
            HTTPStatus.FORBIDDEN: response_definition(
                "Send to own wallet error", Error
            ),
        }

        def post(self):
            try:
                tx_params = request.json

                account_id = self.user.account_id

                currency = DiemCurrency[tx_params["currency"]]
                amount = int(tx_params["amount"])
                receiver_address: str = tx_params["receiver_address"]

                # wyre wallet address
                wyre_wallet_id = receiver_address.split(':')[1] if receiver_address.split(':')[0] == "wallet" else None
                if wyre_wallet_id:
                    user = user_service.get_user_by_wallet(wyre_wallet_id)
                    receiver_id = user.account_id

                    dest = "wallet:" + wyre_wallet_id
                    destCurrency = currency
                    source = "wallet:" + self.user.wyre_wallet_id
                    sourceCurrency = currency
                    request_amount = Amount().deserialize(amount)

                    api = WyreApi()
                    response = api.createTransfer(
                        self.user.wyre_user_id,
                        source,
                        dest,
                        sourceCurrency,
                        str(request_amount._value),
                        destCurrency,
                        True
                    )
                    if response:
                        wyre_transfer_id = response["id"]
                        source_amount = response["sourceAmount"]
                        dest_amount = response["destAmount"]
                        total_fees = response["totalFees"]
                        #exchange_amount = Amount().set(dest_amount)

                        request_amount = Amount().set(source_amount)
                        exchange_amount = Amount().set(dest_amount)

                    tx_id = transaction_service.internal_transaction(
                        sender_id=account_id,
                        receiver_id=receiver_id,
                        amount=amount,
                        currency=currency,
                        payment_type=TransactionType.INTERNAL,
                    ).id
                else:
                    dest_address, dest_sub_address = identifier.decode_account(
                        receiver_address, context.get().config.diem_address_hrp()
                    )

                    tx_id = transaction_service.send_transaction(
                        sender_id=account_id,
                        amount=amount,
                        currency=currency,
                        destination_address=utils.account_address_bytes(dest_address).hex(),
                        destination_subaddress=dest_sub_address.hex()
                        if dest_sub_address
                        else None,
                    )
                return {"id": tx_id}, HTTPStatus.OK
            except transaction_service.RiskCheckError as risk_check_failed_error:
                return self.respond_with_error(
                    HTTPStatus.FAILED_DEPENDENCY, str(risk_check_failed_error)
                )
            except transaction_service.SelfAsDestinationError as send_to_self_error:
                return self.respond_with_error(
                    HTTPStatus.FORBIDDEN, str(send_to_self_error)
                )

    class GetReceivingAddress(AccountView):
        summary = "Get an address for deposit (receive) funds"
        parameters = []
        responses = {
            HTTPStatus.OK: response_definition(
                "Created transaction", schema=FullAddressSchema
            ),
        }

        def post(self):
            user = self.user
            # account_name = user.account.name

            # full_address = account_service.get_deposit_address(
            #     account_name=account_name
            # )
            full_address = "wallet:" + user.wyre_wallet_id

            return {"address": full_address}, HTTPStatus.OK

    @classmethod
    def get_transaction_response_object(
        cls, account_id: int, transaction: Transaction
    ) -> Dict[str, str]:
        direction = get_transaction_direction(
            account_id=account_id, transaction=transaction
        )

        blockchain_tx = None

        if transaction.type != TransactionType.INTERNAL:
            blockchain_tx = {
                "amount": transaction.amount,
                "source": transaction.source_address,
                "destination": transaction.destination_address,
                "expirationTime": "",
                "sequenceNumber": transaction.sequence,
                "status": transaction.status,
                "version": transaction.blockchain_version,
            }

        return {
            "id": transaction.id,
            "amount": transaction.amount,
            "currency": transaction.currency,
            "direction": direction.value.lower(),
            "status": transaction.status,
            "timestamp": transaction.created_timestamp.isoformat(),
            "source": {
                "vasp_name": transaction.source_address,
                "user_id": transaction.source_subaddress,
                "full_addr": identifier.encode_account(
                    transaction.source_address,
                    transaction.source_subaddress,
                    context.get().config.diem_address_hrp(),
                ),
            },
            "destination": {
                "vasp_name": transaction.destination_address,
                    "user_id": transaction.destination_subaddress,
                "full_addr": identifier.encode_account(
                    transaction.destination_address,
                    transaction.destination_subaddress,
                    context.get().config.diem_address_hrp(),
                ),
            },
            "is_internal": transaction.type == TransactionType.INTERNAL,
            "blockchain_tx": blockchain_tx,
            "reference_id": transaction.reference_id,
        }


    @classmethod
    def get_wyre_transaction_response_object(
        cls, tx: Dict[str, str]
    ) -> Dict[str, str]:
        direction = TransactionDirection.RECEIVED if tx['type'] == 'INCOMING' else TransactionDirection.SENT
        status = TransactionStatus.COMPLETED if tx['status'] == 'COMPLETED' else TransactionStatus.PENDING
        source_currency = Currency[tx['sourceCurrency']]
        fees = tx['fees']
        if fees:
            fees = tx['fees'][source_currency.value]
        source_amount = tx['sourceAmount']
        dest_amount = tx['destAmount']
        timestamp = tx['createdAt']/1000
        #Amount().set(dec_amount).serialize()        

        return {
            "id": tx['id'],
            "direction": direction.value.lower(),
            "status": status.value.lower(),
            "timestamp": datetime.utcfromtimestamp(timestamp).isoformat(),
            "source_name": tx['sourceName'],
            "dest_name": tx['destName'],
            "source_currency": tx['sourceCurrency'],
            "dest_currency": tx['destCurrency'],
            "source_amount": Amount().set(source_amount).serialize(),
            "dest_amount": Amount().set(dest_amount).serialize(),
            #"fees": tx['fees'][source_currency.value],
            "fees": Amount().set(fees).serialize() if fees else None,
            "exchange_rate": tx['exchangeRate'],
        }


    @classmethod
    def get_funds_transfer_response_object(
        cls, account_id: int, funds_transfer: FundsTransfer
    ) -> Dict[str, str]:
        tx_ = None
        pc_ = None
        if funds_transfer.transaction:
            tx_ = cls.get_transaction_response_object(
                account_id, funds_transfer.transaction
            )

        if funds_transfer.payment_command:
            pc_ = payment_command_to_dict(funds_transfer.payment_command)

        return {"transaction": tx_, "payment_command": pc_}
