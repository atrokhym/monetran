// Copyright (c) The Diem Core Contributors
// SPDX-License-Identifier: Apache-2.0

export const VALID_VASP_ADDRESS_REGEX = new RegExp("^[a-zA-Z0-9]{50}$");
export const VALID_WYRE_ADDRESS_REGEX = new RegExp("[a-zA-Z0-9]$");

export const ADDR_PROTOCOL_PREFIX = "diem://";
export const WYRE_ADDR_PROTOCOL_PREFIX = "wyre://";


export interface VASPAccount {
  vasp_name: string;
  user_id: string;
  full_addr: string;
}

export interface BlockchainTransaction {
  version: number;
  status: string;
  expirationTime: string;
  source: string;
  destination: string;
  amount: number;
  sequenceNumber: number;
}
