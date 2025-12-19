import type { Address, Hex } from "viem";

export interface KeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

export interface WalletKeys {
  address: Address;
  viewPrivateKey: Uint8Array;
  viewPublicKey: Uint8Array;
  spendPrivateKey: Uint8Array;
  spendPublicKey: Uint8Array;
}

export interface StealthAddress {
  address: Address;
  ephmeralPublicKey: Hex;
  viewTag: number;
}

export interface Commitment {
  commitment: Hex;
  amount: bigint;
  blinding: Hex;
}

export interface PrivateBalance {
  commitments: Commitment[];
  totalAmount: bigint;
}

export interface TransactionData {
  inputs: Commitment[];
  outputs: {
    amount: bigint;
    recipient: StealthAddress;
  }[];
}
