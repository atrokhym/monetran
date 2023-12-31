# pyre-ignore-all-errors

# Copyright (c) The Diem Core Contributors
# SPDX-License-Identifier: Apache-2.0

import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    Boolean,
    ForeignKey,
    BigInteger,
    Float,
)
from sqlalchemy.orm import relationship
from . import Base


class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    password_salt = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    password_reset_token = Column(String, nullable=True)
    password_reset_token_expiration = Column(DateTime, nullable=True)
    registration_status = Column(String, nullable=False)
    selected_fiat_currency = Column(String, nullable=False)
    selected_language = Column(String, nullable=False)

    is_admin = Column(Boolean, default=False)
    is_blocked = Column(Boolean, default=False)

    first_name = Column(String)
    last_name = Column(String)
    dob = Column(Date)
    phone = Column(String)
    country = Column(String)
    state = Column(String)
    city = Column(String)
    address_1 = Column(String)
    address_2 = Column(String)
    zip = Column(String)
    wyre_user_id = Column(String)
    wyre_wallet_id = Column(String)

    account_id = Column(Integer, ForeignKey("account.id"), nullable=True)
    account = relationship("Account", backref="user", foreign_keys=[account_id])

    payment_methods = relationship("PaymentMethod", backref="user", lazy=True)
    orders = relationship("Order", backref="user", lazy=True)


class Account(Base):
    __tablename__ = "account"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)
    subaddresses = relationship("SubAddress", backref="account", lazy=True)


class SubAddress(Base):
    __tablename__ = "subaddress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    address = Column(String, unique=True, nullable=False)
    account_id = Column(Integer, ForeignKey("account.id"), nullable=False)


class PaymentMethod(Base):
    __tablename__ = "paymentmethod"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    name = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    token = Column(String, unique=True, nullable=False)
    raw = Column(String, nullable=True)
    wyre_paymentmethod_id = Column(String, nullable=True)


class Transaction(Base):
    __tablename__ = "transaction"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String, nullable=False)
    amount = Column(BigInteger, nullable=False)
    currency = Column(String, nullable=False)
    status = Column(String, nullable=False, index=True)
    source_id = Column(Integer, ForeignKey("account.id"), nullable=True)
    source_address = Column(String, nullable=True)
    source_subaddress = Column(String, nullable=True)
    destination_id = Column(Integer, ForeignKey("account.id"), nullable=True)
    destination_address = Column(String, nullable=True)
    destination_subaddress = Column(String, nullable=True)
    created_timestamp = Column(DateTime, nullable=False)
    blockchain_version = Column(Integer, nullable=True)
    original_txn_id = Column(String, nullable=True)
    refund_reason = Column(String, nullable=True)
    sequence = Column(Integer, nullable=True)
    logs = relationship("TransactionLog", backref="tx", lazy=True)
    source_account = relationship(
        "Account", backref="sent_transactions", foreign_keys=[source_id]
    )
    destination_account = relationship(
        "Account", backref="received_transactions", foreign_keys=[destination_id]
    )

    reference_id = Column(
        String,
        nullable=True,
        unique=True,
        index=True,
    )


class PaymentCommand(Base):
    __tablename__ = "paymentcommand"

    reference_id = Column(
        String, primary_key=True, nullable=False, unique=True, index=True
    )
    status = Column(String, nullable=False)
    account_id = Column(Integer, ForeignKey("account.id"), nullable=False)
    my_actor_address = Column(String, nullable=False)
    inbound = Column(Boolean, nullable=False)
    cid = Column(String, nullable=False)
    sender_address = Column(String, nullable=True)
    sender_status = Column(String, nullable=False, default="none")
    sender_kyc_data = Column(String, nullable=True)
    sender_metadata = Column(String, nullable=True)
    sender_additional_kyc_data = Column(String, nullable=True)
    receiver_address = Column(String, nullable=False)
    receiver_status = Column(String, nullable=False, default="none")
    receiver_kyc_data = Column(String, nullable=True)
    receiver_metadata = Column(String, nullable=True)
    receiver_additional_kyc_data = Column(String, nullable=True)
    amount = Column(Integer, nullable=False)
    currency = Column(String, nullable=False)
    action = Column(String, nullable=False, default="charge")
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )
    original_payment_reference_id = Column(String, nullable=True)
    recipient_signature = Column(String, nullable=True)
    description = Column(String, nullable=True)
    merchant_name = Column(String, nullable=True)
    expiration = Column(DateTime, nullable=True)

    def update(self, updated_command):
        new_command_attributes = [
            a for a in dir(updated_command) if not a.startswith("_")
        ]
        for key in new_command_attributes:
            try:
                updated_value = getattr(updated_command, key)
                if not callable(updated_value) and getattr(self, key) != updated_value:
                    setattr(self, key, updated_value)
            except AttributeError:
                # An attribute in updated_command does not exist in 'self'
                # We assume this has nothing to do with us and continue to next attribute
                ...


# Execution log for transaction
class TransactionLog(Base):
    __tablename__ = "transactionlog"
    id = Column(Integer, primary_key=True, autoincrement=True)
    tx_id = Column(String, ForeignKey("transaction.id"), nullable=False)
    log = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)


# Separate global execution log
class ExecutionLog(Base):
    __tablename__ = "executionlog"
    id = Column(Integer, primary_key=True, autoincrement=True)
    log = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)


class Order(Base):
    __tablename__ = "order"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    amount = Column(BigInteger, nullable=False)
    exchange_amount = Column(BigInteger, nullable=False)
    direction = Column(String, nullable=False)  # Buy/Sell
    base_currency = Column(String, nullable=False)
    quote_currency = Column(String, nullable=False)
    quote_id = Column(String, nullable=True)
    quote_expiration = Column(DateTime, nullable=True)
    order_expiration = Column(DateTime, nullable=False)
    rate = Column(Integer, nullable=True)
    internal_ledger_tx = Column(String, ForeignKey("transaction.id"), nullable=True)
    last_update = Column(DateTime, nullable=True)
    order_status = Column(String, nullable=False)
    cover_status = Column(String, nullable=False)
    payment_method = Column(String, nullable=True)
    charge_token = Column(String, nullable=True)
    order_type = Column(String, nullable=False)
    correlated_tx = Column(String, ForeignKey("transaction.id"), nullable=True)
    wyre_transfer_id = Column(String, nullable=True)
    wyre_reservation_id = Column(String, nullable=True)
    wyre_reservation_url = Column(String, nullable=True)
    wyre_order_id = Column(String, nullable=True)
    wyre_authorization_url = Column(String, nullable=True)


class Token(Base):
    __tablename__ = "token"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid1()))
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    expiration_time = Column(Float, nullable=False)


class FundsPullPreApprovalCommand(Base):
    __tablename__ = "fundspullpreapprovalcommands"
    funds_pull_pre_approval_id = Column(String, primary_key=True, nullable=False)
    account_id = Column(
        Integer, ForeignKey("account.id"), primary_key=True, nullable=True
    )
    address = Column(String, nullable=True)
    biller_address = Column(String, nullable=False)
    funds_pull_pre_approval_type = Column(String, nullable=False)
    expiration_timestamp = Column(DateTime, nullable=False)
    max_cumulative_unit = Column(String, nullable=True)
    max_cumulative_unit_value = Column(Integer, nullable=True)
    max_cumulative_amount = Column(Integer, nullable=True)
    max_cumulative_amount_currency = Column(String, nullable=True)
    max_transaction_amount = Column(Integer, nullable=True)
    max_transaction_amount_currency = Column(String, nullable=True)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False)
    role = Column(String, nullable=False)
    offchain_sent = Column(Boolean, default=False)
    biller_name = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)

    def update(self, updated_command):
        new_command_attributes = [
            a for a in dir(updated_command) if not a.startswith("_")
        ]
        for key in new_command_attributes:
            try:
                if getattr(self, key) != getattr(updated_command, key):
                    setattr(self, key, getattr(updated_command, key))
            except AttributeError:
                # An attribute in updated_command does not exist in 'self'
                # We assume this has nothing to do with us and continue to next attribute
                ...


class Payment(Base):
    __tablename__ = "payment"
    reference_id = Column(
        String, primary_key=True, nullable=False, unique=True, index=True
    )
    my_address = Column(String)
    vasp_address = Column(String)
    merchant_name = Column(String)
    action = Column(String)
    currency = Column(String)
    amount = Column(Integer)
    expiration = Column(DateTime, nullable=True)
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )
    description = Column(String, nullable=True)
    recipient_signature = Column(String, nullable=True)
    status = Column(String, nullable=False)

    def update(self, updated_command):
        new_command_attributes = [
            a for a in dir(updated_command) if not a.startswith("_")
        ]
        for key in new_command_attributes:
            try:
                updated_value = getattr(updated_command, key)
                if not callable(updated_value) and getattr(self, key) != updated_value:
                    setattr(self, key, updated_value)
            except AttributeError:
                # An attribute in updated_command does not exist in 'self'
                # We assume this has nothing to do with us and continue to next attribute
                ...
