// Copyright (c) The Diem Core Contributors
// SPDX-License-Identifier: Apache-2.0

export type DiemCurrency = "XDM" | "XUS" | "USDC" | "Coin2";

export type FiatCurrency = "USD" | "EUR" | "GBP" | "CHF" | "CAD" | "AUD" | "NZD" | "JPY" | "MXN";

export type DiemCurrenciesSettings = {
  [key in DiemCurrency]: {
    name: string;
    symbol: DiemCurrency;
    sign: string;
  };
};

export type FiatCurrenciesSettings = {
  [key in FiatCurrency]: {
    symbol: FiatCurrency;
    sign: string;
  };
};

export type Rates = {
  [key in FiatCurrency | DiemCurrency]: {
    [key in FiatCurrency | DiemCurrency]: number;
  };
};
