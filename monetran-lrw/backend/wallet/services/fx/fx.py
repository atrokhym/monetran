# Copyright (c) The Diem Core Contributors
# SPDX-License-Identifier: Apache-2.0

from itertools import chain
from diem_utils.precise_amount import Amount
from diem_utils.sdks.liquidity import LpClient
from diem_utils.types.currencies import DiemCurrency, FiatCurrency, WyreCurrency
from diem_utils.types.liquidity.currency import Currency, CurrencyPair, CurrencyPairs
from wallet.services.wyre import (
    WyreApi,
    WyreError,
)

RATES = {}
WYRE_RATES = {}

def get_rate(base_currency: Currency, quote_currency: Currency) -> Amount:
    pair_str = str(CurrencyPair(base_currency, quote_currency))
    if pair_str not in RATES:
        update_rates()
    return RATES[pair_str]


def update_rates():
    all_currencies = [
        Currency(c)
        for c in chain(list(FiatCurrency.__members__), list(DiemCurrency.__members__))
    ]
    base_currencies = [Currency(c) for c in DiemCurrency]
    base_currencies.append(FiatCurrency.USD)

    #for base_currency in base_currencies:
    for base_currency in all_currencies:
        for quote_currency in all_currencies:
            if base_currency == quote_currency:
                continue

            try:
                _set_rate(base_currency, quote_currency)
            except LookupError:
                _set_rate(quote_currency, base_currency)


def _set_rate(base_currency: Currency, quote_currency: Currency):
    global RATES
    if base_currency in list(WyreCurrency.__members__) and quote_currency in list(WyreCurrency.__members__):
        rate = _get_rate_wyre(
            base_currency=base_currency, quote_currency=quote_currency
        )
    else:
        rate = _get_rate_internal(
            base_currency=base_currency, quote_currency=quote_currency
        )
    RATES[str(CurrencyPair(base_currency, quote_currency))] = rate
    unit = Amount().deserialize(Amount.unit)
    rate = unit / rate
    RATES[str(CurrencyPair(quote_currency, base_currency))] = rate


def _get_rate_internal(base_currency: Currency, quote_currency: Currency) -> Amount:
    currency_pair = CurrencyPair(base_currency, quote_currency)
    pair_str = f"{base_currency.value}_{quote_currency.value}"

    if pair_str in CurrencyPairs.__members__:
        quote = LpClient().get_quote(pair=currency_pair, amount=1)
        return Amount().deserialize(quote.rate.rate)

    raise LookupError(f"No conversion to currency pair {currency_pair}")


def _get_rate_wyre(base_currency: Currency, quote_currency: Currency) -> Amount:
    global WYRE_RATES
    if len(WYRE_RATES) == 0:
        api = WyreApi()
        response = api.getRates()
        if response:
            WYRE_RATES = response

    #currency_pair = CurrencyPair(base_currency, quote_currency)
    #pair_str = f"{base_currency.value}_{quote_currency.value}"
    wyre_pair_str = f"{base_currency.value}{quote_currency.value}"

    #if pair_str in CurrencyPairs.__members__:
    rate = WYRE_RATES[wyre_pair_str]
    return Amount().set(rate)
        #return Amount().deserialize(quote.rate.rate)

    #raise LookupError(f"No conversion to currency pair {currency_pair}")
