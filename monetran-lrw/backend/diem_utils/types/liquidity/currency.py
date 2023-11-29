# Copyright (c) The Diem Core Contributors
# SPDX-License-Identifier: Apache-2.0

from dataclasses import dataclass
from enum import Enum

from dataclasses_json import dataclass_json


class Currency(str, Enum):
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    CHF = "CHF"
    CAD = "CAD"
    AUD = "AUD"
    NZD = "NZD"
    JPY = "JPY"

    XUS = "XUS"

    MXN = "MXN"
    USDC = "USDC"


FIAT_CURRENCIES = [
    Currency.USD,
    Currency.EUR,
    Currency.GBP,
    Currency.CHF,
    Currency.CAD,
    Currency.AUD,
    Currency.NZD,
    Currency.JPY,
    Currency.MXN,
]


def is_fiat(currency: Currency) -> bool:
    return currency in FIAT_CURRENCIES


def is_diem(currency: Currency) -> bool:
    return currency not in FIAT_CURRENCIES


@dataclass_json
@dataclass
class CurrencyPair:
    base: Currency  # BUY / SELL currency
    quote: Currency  # The Currency you want to Pay with / Get in exchange to the base currency

    def __repr__(self):
        return f"{self.base}_{self.quote}"

    def __str__(self):
        return f"{self.base}_{self.quote}"

    def __hash__(self):
        return hash(str(self))

    @staticmethod
    def is_diem_to_diem(pair: "CurrencyPair"):
        return is_diem(pair.base) and is_diem(pair.quote)


class CurrencyPairs(Enum):
    XUS_USD = CurrencyPair(base=Currency.XUS, quote=Currency.USD)
    XUS_EUR = CurrencyPair(base=Currency.XUS, quote=Currency.EUR)

    EUR_XUS = CurrencyPair(base=Currency.EUR, quote=Currency.XUS)

    XUS_JPY = CurrencyPair(base=Currency.XUS, quote=Currency.JPY)
    XUS_CHF = CurrencyPair(base=Currency.XUS, quote=Currency.CHF)
    XUS_CAD = CurrencyPair(base=Currency.XUS, quote=Currency.CAD)

    GBP_XUS = CurrencyPair(base=Currency.GBP, quote=Currency.XUS)
    AUD_XUS = CurrencyPair(base=Currency.AUD, quote=Currency.XUS)
    NZD_XUS = CurrencyPair(base=Currency.NZD, quote=Currency.XUS)

    XUS_MXN = CurrencyPair(base=Currency.XUS, quote=Currency.MXN)
    XUS_USDC = CurrencyPair(base=Currency.XUS, quote=Currency.USDC)
    USDC_XUS = CurrencyPair(base=Currency.USDC, quote=Currency.XUS)
    USDC_USD = CurrencyPair(base=Currency.USDC, quote=Currency.USD)
    USD_USDC = CurrencyPair(base=Currency.USD, quote=Currency.USDC)

    USDC_EUR = CurrencyPair(base=Currency.USDC, quote=Currency.EUR)
    USDC_JPY = CurrencyPair(base=Currency.USDC, quote=Currency.JPY)
    USDC_CHF = CurrencyPair(base=Currency.USDC, quote=Currency.CHF)
    USDC_CAD = CurrencyPair(base=Currency.USDC, quote=Currency.CAD)
    USDC_MXN = CurrencyPair(base=Currency.USDC, quote=Currency.MXN)
    GBP_USDC = CurrencyPair(base=Currency.GBP, quote=Currency.USDC)
    AUD_USDC = CurrencyPair(base=Currency.AUD, quote=Currency.USDC)
    NZD_USDC = CurrencyPair(base=Currency.NZD, quote=Currency.USDC)

    @staticmethod
    def from_pair(pair: CurrencyPair):
        return CurrencyPairs[str(pair)]
