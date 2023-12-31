# Copyright (c) The Diem Core Contributors
# SPDX-License-Identifier: Apache-2.0

from itertools import chain

from marshmallow import Schema, fields
from marshmallow.validate import OneOf, Range

from diem_utils.types.currencies import Currencies, DiemCurrency, FiatCurrency
from diem_utils.types.liquidity.currency import Currency
from wallet.types import TransactionDirection, TransactionStatus

SUPPORTED_CONVERSIONS = [
    f"{base}_{quote}"
    #for base in DiemCurrency
    for base in chain(list(FiatCurrency.__members__), list(DiemCurrency.__members__))
    for quote in chain(list(FiatCurrency.__members__), list(DiemCurrency.__members__))
]


def diem_amount_field(**kwargs) -> fields.Field:
    """Defines Diem amount schema field"""
    return fields.Int(
        description="Amount of microdiems",
        validate=Range(min=0),
        strict=True,
        **kwargs,
    )


def fiat_amount_field(**kwargs) -> fields.Field:
    """Defines fiat currency amount schema field"""
    return fields.Int(
        description="Amount of fiat currency in scale factor 6",
        validate=Range(min=1),
        strict=True,
        **kwargs,
    )


def fiat_currency_code_field(**kwargs) -> fields.Field:
    """Defines fiat currency code schema field"""
    return fields.Str(
        description="Fiat currency code",
        validate=OneOf(list(FiatCurrency.__members__)),
        **kwargs,
    )


def diem_currency_code_field(**kwargs) -> fields.Field:
    """Defines Diem currency code schema field"""
    return fields.Str(
        description="Diem currency code",
        validate=OneOf(list(DiemCurrency.__members__)),
        **kwargs,
    )


def currency_code_field(**kwargs) -> fields.Field:
    """Defines Currencies code schema field"""
    return fields.Str(
        description="Diem currency code",
        validate=OneOf(list(Currency.__members__)),
        #validate=OneOf(chain(list(FiatCurrency.__members__), list(DiemCurrency.__members__)))
        **kwargs,
    )


def transaction_direction_field(**kwargs) -> fields.Field:
    """Defines Diem currency code schema field"""
    return fields.Str(
        description="Transaction direction",
        validate=OneOf([td.lower() for td in list(TransactionDirection.__members__)]),
        **kwargs,
    )


def transaction_status_field(**kwargs) -> fields.Field:
    """Defines Diem currency code schema field"""
    return fields.Str(
        description="Transaction status",
        validate=OneOf([ts.lower() for ts in list(TransactionStatus.__members__)]),
        **kwargs,
    )


def currency_pair_field(**kwargs) -> fields.Field:
    """Defines currency pair schema field"""
    return fields.Str(
        description="Defines bought and sold currencies. "
        "Has the form `<base currency>_<counter currency>`",
        validate=OneOf(SUPPORTED_CONVERSIONS),
        **kwargs,
    )


class RequestForQuote(Schema):
    action = fields.Str(required=True, validate=OneOf(["buy", "sell"]))
    amount = diem_amount_field(required=True)
    currency_pair = currency_pair_field(required=True)
    payment_method = fields.Str(required=False, allow_none=True, missing=None)


class Quote(Schema):
    quote_id = fields.Str(required=True)
    rfq = fields.Nested(RequestForQuote, required=True)
    price = diem_amount_field(required=True)
    expiration_time = fields.DateTime(required=True)


class QuoteStatus(Schema):
    status = fields.Str(required=True, validate=OneOf(["Pending", "Success", "Failed"]))


class QuoteUrl(Schema):
    url = fields.Str(required=False)


class QuoteExecution(Schema):
    payment_method = fields.Str(required=False, allow_none=True, missing=None)


class Rate(Schema):
    currency_pair = currency_pair_field(required=True)
    price = diem_amount_field(required=True)


class RateResponse(Schema):
    rates = fields.List(fields.Nested(Rate))


class User(Schema):
    username = fields.Str(required=True)
    registration_status = fields.Str(required=True)
    is_admin = fields.Bool(required=True)

    first_name = fields.Str(required=True)
    last_name = fields.Str(required=True)


class Users(Schema):
    users = fields.List(fields.Nested(User))


class UserCreationRequest(Schema):
    username = fields.Str(required=True)
    is_admin = fields.Bool(required=True)
    first_name = fields.Str(required=True)
    last_name = fields.Str(required=True)
    password = fields.Str(required=True)


class Debt(Schema):
    debt_id = fields.Str(required=True)
    currency = fiat_currency_code_field(required=True)
    amount = fiat_amount_field(required=True)


class PendingSettlement(Schema):
    debt = fields.List(fields.Nested(Debt))


class DebtSettlement(Schema):
    settlement_confirmation = fields.Str(required=True)


class Balance(Schema):
    currency = currency_code_field(required=True)
    balance = diem_amount_field(required=True)


class Balances(Schema):
    balances = fields.List(fields.Nested(Balance), required=True)


class UserAddress(Schema):
    user_id = fields.Str(required=False, allow_none=True)
    vasp_name = fields.Str(required=False, allow_none=True)
    full_addr = fields.Str(required=False, allow_none=True)


class BlockchainTransaction(Schema):
    amount = diem_amount_field()
    status = fields.Str()
    source = fields.Str(allow_none=True)
    destination = fields.Str(allow_none=True)
    expirationTime = fields.Str(allow_none=True)
    sequenceNumber = fields.Int(allow_none=True)
    version = fields.Int(allow_none=True)


class TransactionId(Schema):
    id = fields.Str(required=True)


class Transaction(Schema):
    id = fields.Str(required=True)
    amount = diem_amount_field(required=True)
    currency = currency_code_field(required=True)
    direction = transaction_direction_field(required=True)
    status = transaction_status_field(required=True)
    timestamp = fields.Str(required=True)
    source = fields.Nested(UserAddress)
    destination = fields.Nested(UserAddress)
    blockchain_tx = fields.Nested(
        BlockchainTransaction, required=False, allow_none=True
    )
    reference_id: str


class WyreTransaction(Schema):
    id = fields.Str(required=True)
    direction = transaction_direction_field(required=True)
    status = transaction_status_field(required=True)
    timestamp = fields.Str(required=True)
    source_name: fields.Str(required=True)
    dest_name: fields.Str(required=True)
    source_currency: currency_code_field(required=True)
    dest_currency: currency_code_field(required=True)
    source_amount: diem_amount_field(required=True)
    dest_amount: diem_amount_field(required=True)
    fees: diem_amount_field(required=False)
    exchange_rate: diem_amount_field(required=False)  


class CreateTransaction(Schema):
    currency = diem_currency_code_field(required=True)
    amount = diem_amount_field(required=True)
    receiver_address = fields.Str(required=True)


class AccountTransactions(Schema):
    transaction_list = fields.List(fields.Nested(Transaction))


class WyreAccountTransactions(Schema):
    transaction_list = fields.List(fields.Nested(WyreTransaction))


class FullAddress(Schema):
    address = fields.Str(required=True)


class Error(Schema):
    error = fields.Str(required=True)
    code = fields.Int(required=True)


class TotalUsers(Schema):
    user_count = fields.Int(required=True)


class Chain(Schema):
    chain_id = fields.Int(required=True)
    display_name = fields.Str(required=True)


class StatusObject(Schema):
    status = fields.Str(required=True)


class PaymentActorObject(Schema):
    address = fields.Str(required=True, allow_none=False)
    status = fields.Nested(StatusObject)
    kyc_data = fields.Str(required=False)
    metadata = fields.Str(required=False)
    additional_kyc_data = fields.Str(required=False)


class PaymentActionObject(Schema):
    amount = fields.Int(required=True)
    currency = fields.Str(required=True)
    action = fields.Str(required=True, validate=OneOf(["charge", "auth", "capture"]))
    timestamp = fields.Int(required=True)


class PaymentObject(Schema):
    reference_id = fields.Str(required=True, allow_none=False)
    sender = fields.Nested(PaymentActorObject)
    receiver = fields.Nested(PaymentActorObject)
    action = fields.Nested(PaymentActionObject)
    original_payment_reference_id = fields.Str(required=False)
    recipient_signature = fields.Str(required=False)
    description = fields.Str(required=False)


class GetPaymentInfoRequest(Schema):
    vasp_address = fields.Str(required=True)
    reference_id = fields.Str(required=True)


class Payment(Schema):
    vasp_address = fields.Str(required=True)
    reference_id = fields.Str(required=True)
    merchant_name = fields.Str(required=True)
    action = fields.Str(required=True, validate=OneOf(["charge", "auth"]))
    currency = diem_currency_code_field(required=True)
    amount = fields.Int(required=True)
    expiration = fields.Int(required=False, allow_none=True)
    status = fields.Str(required=True)


class PaymentCommand(Schema):
    my_actor_address = fields.Str(required=True, allow_none=False)
    payment = fields.Nested(PaymentObject)
    inbound = fields.Bool(required=True)
    cid = fields.Str(required=True)


class PaymentCommands(Schema):
    payment_commands = fields.List(fields.Nested(PaymentCommand))


class Currency(Schema):
    amount = fields.Int(required=True)
    currency = diem_currency_code_field(required=True)


class ScopedCumulativeAmount(Schema):
    unit = fields.Str(required=True, validate=OneOf(["day", "week", "month", "year"]))
    value = fields.Int(required=True)
    max_amount = fields.Nested(Currency)


class Scope(Schema):
    type = fields.Str(required=True, validate=OneOf(["consent", "save_sub_account"]))
    expiration_timestamp = fields.Int(required=True)
    max_cumulative_amount = fields.Nested(ScopedCumulativeAmount, required=False)
    max_transaction_amount = fields.Nested(Currency, required=False)


class FundsPullPreApproval(Schema):
    address = fields.Str(required=True)
    biller_address = fields.Str(required=True)
    funds_pull_pre_approval_id = fields.Str(required=True)
    scope = fields.Nested(Scope)
    description = fields.Str(required=False)
    status = fields.Str(
        required=True, validate=OneOf(["pending", "valid", "rejected", "closed"])
    )
    biller_name = fields.Str(required=False)
    created_timestamp = fields.DateTime(required=True)
    updated_at = fields.DateTime(required=True)


class FundsPullPreApprovalList(Schema):
    funds_pull_pre_approval_list = fields.List(fields.Nested(FundsPullPreApproval))


class FundsPullPreApprovalRequestCreationResponse(Schema):
    funds_pull_pre_approval_id = fields.Str(required=True)
    address = fields.Str(required=False)


class FundsTransfer(Schema):
    transaction = fields.Nested(Transaction, required=False, allow_none=True)
    payment_command = fields.Nested(PaymentCommand, required=False, allow_none=True)


class UpdateFundsPullPreApproval(Schema):
    status = fields.Str(required=True, validate=OneOf(["valid", "rejected", "closed"]))


class CreateAndApproveFundPullPreApproval(Schema):
    biller_address = fields.Str(required=True)
    funds_pull_pre_approval_id = fields.Str(required=True)
    scope = fields.Nested(Scope)
    description = fields.Str(required=False)


class FundsPullPreApprovalRequest(Schema):
    payer_address = fields.Str(required=False, allow_none=True)
    scope = fields.Nested(Scope)
    description = fields.Str(required=False)


class CreatePaymentCommand(Schema):
    reference_id = fields.Str(required=True)
    action = fields.Str(required=True, validate=OneOf(["charge", "auth", "capture"]))
    currency = fields.Str(required=True)
    amount = fields.Int(required=True)
    expiration = fields.Int(required=True)


class CreatePayment(CreatePaymentCommand):
    vasp_address = fields.Str(required=True)
    merchant_name = fields.Str(required=True)


class PreparePaymentInfoResponse(Schema):
    reference_id = fields.Str(required=True)
    address = fields.Str(required=False)


class ApprovePaymentSchema(Schema):
    init_offchain_required = fields.Bool(required=False, default=False)
