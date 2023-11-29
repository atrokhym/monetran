# Copyright (c) The Diem Core Contributors
# SPDX-License-Identifier: Apache-2.0

import typing
from enum import Enum


class DiemCurrency(str, Enum):
    XUS = "XUS"
    USDC = "USDC"


class WyreCurrency(str, Enum):
    USDC = "USDC"
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    CHF = "CHF"
    CAD = "CAD"
    AUD = "AUD"
    NZD = "NZD"
    JPY = "JPY"
    MXN = "MXN"


class FiatCurrency(str, Enum):
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    CHF = "CHF"
    CAD = "CAD"
    AUD = "AUD"
    NZD = "NZD"
    JPY = "JPY"
    MXN = "MXN"


Currencies = typing.Union[FiatCurrency, DiemCurrency]

DEFAULT_DIEM_CURRENCY = DiemCurrency.XUS.value
