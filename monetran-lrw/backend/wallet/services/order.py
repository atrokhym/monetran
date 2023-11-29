# pyre-ignore-all-errors

# Copyright (c) The Diem Core Contributors
# SPDX-License-Identifier: Apache-2.0

import time
import typing
import uuid
import json
import logging
from datetime import datetime, timedelta
from typing import Optional

from diem_utils.precise_amount import Amount
from diem_utils.types.currencies import DiemCurrency, Currencies
from diem_utils.types.liquidity.currency import Currency, CurrencyPair, CurrencyPairs
from wallet import services
from wallet import storage
from wallet.services import inventory, INVENTORY_ACCOUNT_NAME
from wallet.services.fx.fx import get_rate
from wallet.services.inventory import buy_funds, INVENTORY_COVER_CURRENCY
from wallet.services.transaction import (
    internal_transaction,
    validate_balance,
)
from wallet.services.user import get_payment_methods
from wallet.storage import (
    get_order,
    update_order,
    Order,
    get_account,
    get_user,
)
from wallet.types import (
    OrderStatus,
    Direction,
    CoverStatus,
    OrderId,
    TransactionType,
    BalanceError,
    ConvertResult,
    PaymentMethodAction,
    OrderType,
)
from wallet.services.wyre import (
    WyreApi,
    WyreError,
)

logger = logging.getLogger(__name__)


PAYMENT_PROCESSING_DUMMY_SLEEP_TIME = 3


def process_payment_method(
    payment_method: str, amount: int, action: PaymentMethodAction
):
    """
    In real scenario charge token will be provided by the PSP.
    This is only a very simplified simulation of it...
    :param payment_method:
    :return:
    """
    if payment_method:
        return str(uuid.uuid4())
    else:
        return None


def process_order_payment(order_id, payment_method, action: PaymentMethodAction):
    order = get_order(order_id)

    time.sleep(PAYMENT_PROCESSING_DUMMY_SLEEP_TIME)
    charge_token = process_payment_method(payment_method, order.exchange_amount, action)

    if charge_token:
        update_order(
            order_id=order_id,
            charge_token=charge_token,
            order_status=OrderStatus.Charged.value,
            payment_method=payment_method,
        )
    else:
        update_order(
            order_id=order_id,
            order_status=OrderStatus.FailedCharge.value
            if action == PaymentMethodAction.Charge
            else OrderStatus.FailedCredit,
            payment_method=payment_method,
        )

    return charge_token


def create_order(
    user_id: int,
    direction: Direction,
    amount: int,
    base_currency: Currencies,
    quote_currency: Currencies,
    payment_method: Optional[str] = None,
) -> Order:
    expiration_time = datetime.utcnow() + timedelta(minutes=10)

    conversion_rate = get_rate(
        base_currency=Currency(base_currency),
        quote_currency=Currency(quote_currency),
    )
    request_amount = Amount().deserialize(amount)
    exchange_amount = request_amount * conversion_rate

    order_type = OrderType.Trade

    if CurrencyPair.is_diem_to_diem(
        CurrencyPair(Currency(base_currency), Currency(quote_currency))
    ):  # or base_currency == Currency("USDC"):
        order_type = OrderType.DirectConvert

    user = get_user(user_id)

    wyre_transfer_id = None
    wyre_reservation_id = None
    if payment_method:

        pmlist = get_payment_methods(user_id)
        pm = next((x for x in pmlist if str(x.id) == payment_method), None)
        if pm:

            if pm.provider == "BankAccount":
                #
                # execute wyre transfer
                #
                # response fields: exchangeRate, totalFees, sourceAmount, destAmount
                # sourceAmount * exchangeRate = destAmount

                if Direction[direction] == Direction.Buy:
                    source = "paymentmethod:" + pm.wyre_paymentmethod_id
                    sourceCurrency = quote_currency
                    dest = "wallet:" + user.wyre_wallet_id
                    destCurrency = base_currency
                else:
                    dest = "paymentmethod:" + pm.wyre_paymentmethod_id
                    destCurrency = quote_currency
                    source = "wallet:" + user.wyre_wallet_id
                    sourceCurrency = base_currency


                api = WyreApi()
                response = api.createTransfer(
                    user.wyre_user_id,
                    source,
                    dest,
                    sourceCurrency,
                    str(request_amount._value),
                    destCurrency,
                )
                if response:
                    wyre_transfer_id = response["id"]
                    source_amount = response["sourceAmount"]
                    dest_amount = response["destAmount"]
                    total_fees = response["totalFees"]
                    #exchange_amount = Amount().set(dest_amount)

                    if Direction[direction] == Direction.Buy:
                        request_amount = Amount().set(dest_amount)
                        exchange_amount = Amount().set(source_amount)
                    else:
                        request_amount = Amount().set(source_amount)
                        exchange_amount = Amount().set(dest_amount)

            elif pm.provider == "CreditCard":
                #
                # execute wyre order reserve
                #
                api = WyreApi()

                response = api.getWallet(user.wyre_wallet_id, user.wyre_user_id)
                if response:
                    eth_id = response["depositAddresses"]["ETH"]
                    if eth_id:
                        dest = "ethereum:" + eth_id
                        # response = api.createOrderQuote(user, quote_currency, str(request_amount._value), base_currency, dest)
                        response = api.createOrderReserve(
                            user,
                            quote_currency,
                            str(request_amount._value),
                            base_currency,
                            dest,
                        )
                        if response:
                            wyre_reservation_id = response["reservation"]
                            response = api.getOrderReservation(wyre_reservation_id)
                            if response:
                                source_amount = response["quote"]["sourceAmount"]
                                dest_amount = response["quote"]["destAmount"]
                                # total_fees = response['totalFees']

                                request_amount = Amount().set(dest_amount)
                                exchange_amount = Amount().set(source_amount)
    else:
        if Direction[direction] == Direction.Buy:
            source = "wallet:" + user.wyre_wallet_id
            sourceCurrency = quote_currency
            dest = "wallet:" + user.wyre_wallet_id
            destCurrency = base_currency
        else:
            dest = "wallet:" + user.wyre_wallet_id
            destCurrency = quote_currency
            source = "wallet:" + user.wyre_wallet_id
            sourceCurrency = base_currency

        api = WyreApi()
        response = api.createTransfer(
            user.wyre_user_id,
            source,
            dest,
            sourceCurrency,
            str(request_amount._value),
            destCurrency,
        )
        if response:
            wyre_transfer_id = response["id"]
            source_amount = response["sourceAmount"]
            dest_amount = response["destAmount"]
            total_fees = response["totalFees"]
            #exchange_amount = Amount().set(dest_amount)

            if Direction[direction] == Direction.Buy:
                request_amount = Amount().set(dest_amount)
                exchange_amount = Amount().set(source_amount)
            else:
                request_amount = Amount().set(source_amount)
                exchange_amount = Amount().set(dest_amount)

    return storage.create_order(
        user_id=user_id,
        amount=request_amount.serialize(),
        direction=direction,
        base_currency=base_currency.value,
        quote_currency=quote_currency.value,
        expiration_time=expiration_time,
        exchange_amount=exchange_amount.serialize(),
        order_type=order_type.value,
        wyre_transfer_id=wyre_transfer_id,
        wyre_reservation_id=wyre_reservation_id,
    )


def process_order(order_id: OrderId, payment_method: str):
    if services.run_bg_tasks():
        from ..background_tasks.background import async_execute_order

        async_execute_order.send(order_id, payment_method)
    else:
        execute_order(order_id=order_id, payment_method=payment_method)


def execute_order(order_id: OrderId, payment_method: Optional[str] = None):
    if order_expired(order_id):
        return

    order = get_order(order_id)
    if payment_method:
        process_payment_method(
            payment_method=payment_method,
            amount=order.amount,
            action=PaymentMethodAction.Charge,
        )

    if order.order_type == OrderType.Trade:
        if execute_trade(order, payment_method):
            if services.run_bg_tasks():
                from ..background_tasks.background import async_cover_order

                async_cover_order.send(order_id)
            else:
                cover_order(order_id=order_id)
    else:
        execute_convert(order)


def execute_trade(order: Order, payment_method: Optional[str] = None):
    inventory_account_id = get_account(account_name=INVENTORY_ACCOUNT_NAME).id
    user = get_user(order.user_id)
    user_account_id = user.account.id
    order_id = typing.cast(OrderId, order.id)

    #base_currency = DiemCurrency[order.base_currency]
    base_currency = Currency[order.base_currency]
    quote_currency = Currency[order.quote_currency]
    request_amount = Amount().deserialize(order.amount)

    if Direction[order.direction] == Direction.Buy:
        sender_id = inventory_account_id
        receiver_id = user_account_id

        if not validate_balance(sender_id, order.amount, base_currency):
            buy_funds(CurrencyPairs[f"{base_currency}_{INVENTORY_COVER_CURRENCY}"])
    else:
        sender_id = user_account_id
        receiver_id = inventory_account_id

    try:
        transaction = internal_transaction(
            sender_id=sender_id,
            receiver_id=receiver_id,
            amount=order.amount,
            currency=base_currency,
            payment_type=TransactionType.INTERNAL,
        )

        #
        #   wyre cover
        #

        wyre_order_id = None
        wyre_authorization_url = None

        if payment_method:
            pmlist = get_payment_methods(order.user_id)
            pm = next((x for x in pmlist if str(x.id) == payment_method), None)
            if pm:

                if pm.provider == "BankAccount":
                    #
                    # confirm wyre transfer
                    #
                    wyre_transfer_id = order.wyre_transfer_id
                    if wyre_transfer_id:
                        api = WyreApi()
                        response = api.confirmTransfer(
                                            user.wyre_user_id,
                                            wyre_transfer_id
                                            )
                        # if response:
                        #     wyre_transfer_id = response['id']

                elif pm.provider == "CreditCard":
                    #
                    # execute wyre order reserve
                    #
                    api = WyreApi()
                    response = api.getWallet(user.wyre_wallet_id, user.wyre_user_id)

                    if response:
                        eth_id = response["depositAddresses"]["ETH"]

                        if eth_id:
                            dest = "ethereum:" + eth_id
                            wyre_reservation_id = order.wyre_reservation_id
                            if wyre_reservation_id:

                                cc = json.loads(pm.raw)
                                response = api.createCardOrder(
                                    user,
                                    quote_currency,
                                    str(request_amount._value),
                                    base_currency,
                                    dest,
                                    cc,
                                    wyre_reservation_id,
                                )

                                if response:
                                    wyre_order_id = response["id"]
                                    logger.info(f"wyre_order_id: {wyre_order_id}")
                                    status = response["status"]
                                    if status == "RUNNING_CHECKS":
                                        for i in range(60):
                                            response = api.getCardOrderAuthorization(
                                                wyre_order_id
                                            )
                                            if response:
                                                wyre_authorization_url = response[
                                                    "authorization3dsUrl"
                                                ]
                                                if wyre_authorization_url:
                                                    logger.info(
                                                        f"wyre_authorization_url: {wyre_authorization_url}"
                                                    )
                                                    break
                                                else:
                                                    logger.info(f"sleeping...")
                                                    time.sleep(1)
                                        if not wyre_authorization_url:
                                            logger.info(
                                                f"gave-up...no wyre_authorization_url"
                                            )
        else:
            wyre_transfer_id = order.wyre_transfer_id
            if wyre_transfer_id:
                api = WyreApi()
                response = api.confirmTransfer(
                                    user.wyre_user_id,
                                    wyre_transfer_id
                                    )

        update_order(
            order_id=order_id,
            internal_ledger_tx=transaction.id,
            order_status=OrderStatus.Executed,
            wyre_order_id=wyre_order_id,
            wyre_authorization_url=wyre_authorization_url,
        )

        return True

    except BalanceError:
        logging.exception("execute trade")
        update_order(order_id=order_id, order_status=OrderStatus.FailedExecute)
        return False

    except WyreError as error:
        logging.exception("execute trade")
        update_order(order_id=order_id, order_status=OrderStatus.FailedExecute)
        #return False
        raise error


def execute_convert(order: Order) -> ConvertResult:
    inventory_account = get_account(account_name=INVENTORY_ACCOUNT_NAME).id
    user_account = get_user(order.user_id).account.id
    order_id = typing.cast(OrderId, order.id)

    from_amount = order.amount
    from_diem_currency = DiemCurrency[order.base_currency]
    to_amount = order.exchange_amount
    to_diem_currency = DiemCurrency[order.quote_currency]

    if not validate_balance(
        sender_id=user_account, amount=from_amount, currency=from_diem_currency
    ):
        return ConvertResult.InsufficientBalance

    if not validate_balance(
        sender_id=inventory_account, amount=to_amount, currency=to_diem_currency
    ):
        return ConvertResult.InsufficientInventoryBalance

    try:
        to_inventory_tx = internal_transaction(
            sender_id=user_account,
            receiver_id=inventory_account,
            amount=from_amount,
            currency=from_diem_currency,
            payment_type=TransactionType.INTERNAL,
        )
        from_inventory_tx = internal_transaction(
            sender_id=inventory_account,
            receiver_id=user_account,
            amount=to_amount,
            currency=to_diem_currency,
            payment_type=TransactionType.INTERNAL,
        )
        update_order(
            order_id=order_id,
            internal_ledger_tx=to_inventory_tx.id,
            correlated_tx=from_inventory_tx.id,
            order_status=OrderStatus.Executed,
        )
        return ConvertResult.Success
    except Exception:
        logging.exception("execute convert")
        update_order(order_id=order_id, order_status=OrderStatus.FailedExecute)
        return ConvertResult.TransferFailure


def order_expired(order_id: OrderId):
    order = get_order(order_id)

    is_expired = datetime.utcnow() > order.order_expiration

    if is_expired:
        update_order(order_id=order_id, order_status=OrderStatus.Expired)
        return True

    return False


def is_executed(order_id: OrderId):
    order = get_order(order_id)
    return OrderStatus[order.order_status] == OrderStatus.Executed


def get_order_url(order_id: OrderId) -> str:
    order = get_order(order_id)
    return order.wyre_authorization_url
    # return order.wyre_reservation_url


def cover_order(order_id: OrderId):
    #order = get_order(order_id)

    # if order.order_type == OrderType.DirectConvert.value:
    # if ((order.order_type == OrderType.DirectConvert.value) or 
    #     (order.base_currency == DiemCurrency.USDC) or
    #     (order.quote_currency == DiemCurrency.USDC)
    # ):
    update_order(order_id=order_id, cover_status=CoverStatus.Covered)
    return

    #inventory.cover_order(order)
