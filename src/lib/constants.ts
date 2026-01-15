import type { Address } from "viem";
import { mantleSepoliaTestnet, mantle } from "@mantleio/viem/chains";
import { sepolia } from "viem/chains";

// ============================================================================
// Contract Addresses
// ============================================================================

export const CONTRACT_ADDRESSES = {
  // Mantle Sepolia Testnet
  [mantleSepoliaTestnet.id]: {
    gelapShieldedAccount:
      "0x0D5Ff322a648a6Ff62C5deA028ea222dFefc5225" as Address,
    mockSP1Verifier: "0x353eab5168B94e69e200A20868fFB1C4ABc6Ad3c" as Address,
  },
  // Mantle Mainnet (placeholder - update when deployed)
  [mantle.id]: {
    gelapShieldedAccount:
      "0x0000000000000000000000000000000000000000" as Address,
    mockSP1Verifier: "0x0000000000000000000000000000000000000000" as Address,
  },
} as const;

// Default chain for development
export const DEFAULT_CHAIN_ID = mantleSepoliaTestnet.id;

// ============================================================================
// Supported Tokens
// ============================================================================

export interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}

export const SUPPORTED_TOKENS: Record<number, TokenInfo[]> = {
  [mantleSepoliaTestnet.id]: [
    // Only ERC20 tokens can be deposited to the shielded pool
    // Native MNT cannot be deposited directly (shown separately as WMNT balance)
    {
      address: "0x0A7853C1074722A766a27d4090986bF8A74DA39f" as Address,
      symbol: "mUSDT",
      name: "Mock Tether",
      decimals: 18,
    },
  ],
  [mantle.id]: [
    {
      address: "0x65e37B558F64E2Be5768DB46DF22F93d85741A9E" as Address,
      symbol: "SepMNT",
      name: "Sepolia Mantle Token",
      decimals: 18,
    },
  ],
  [sepolia.id]: [
    {
      address: "0x65e37B558F64E2Be5768DB46DF22F93d85741A9E" as Address,
      symbol: "SepMNT",
      name: "Sepolia Mantle Token",
      decimals: 18,
    },
  ],
};

// ============================================================================
// Contract ABIs
// ============================================================================

export const GELAP_SHIELDED_ACCOUNT_ABI = [
  // State Variables (read)
  {
    inputs: [],
    name: "merkleRoot",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "nullifierUsed",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "zeroHashes",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextLeafIndex",
    outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "sp1Verifier",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "sp1ProgramVKey",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },

  // Deposit
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "bytes32", name: "commitment", type: "bytes32" },
      { internalType: "bytes", name: "encryptedMemo", type: "bytes" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Transact (private transfer)
  {
    inputs: [
      { internalType: "bytes", name: "publicInputs", type: "bytes" },
      { internalType: "bytes", name: "proofBytes", type: "bytes" },
    ],
    name: "transact",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Withdraw
  {
    inputs: [
      { internalType: "bytes", name: "publicInputs", type: "bytes" },
      { internalType: "bytes", name: "proofBytes", type: "bytes" },
      { internalType: "address", name: "receiver", type: "address" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Execute Swap (dark pool)
  {
    inputs: [
      { internalType: "bytes", name: "publicInputs", type: "bytes" },
      { internalType: "bytes", name: "proofBytes", type: "bytes" },
    ],
    name: "executeSwap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Events
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "commitment",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "encryptedMemo",
        type: "bytes",
      },
    ],
    name: "AccountUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "newRoot",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32[]",
        name: "nullifiers",
        type: "bytes32[]",
      },
      {
        indexed: false,
        internalType: "bytes32[]",
        name: "newCommitments",
        type: "bytes32[]",
      },
    ],
    name: "TransactionExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "WithdrawExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "newRoot",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "orderAKeyImage",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "orderBKeyImage",
        type: "bytes32",
      },
    ],
    name: "SwapExecuted",
    type: "event",
  },
] as const;

// ERC20 ABI (minimal for approve and allowance)
export const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ============================================================================
// Merkle Tree Configuration
// ============================================================================

export const MERKLE_TREE_DEPTH = 32;

// ============================================================================
// Prover API Configuration (Mock for now - replace with real endpoint)
// ============================================================================

export const PROVER_API_URL =
  process.env.NEXT_PUBLIC_PROVER_API_URL || "http://localhost:3001";

export const PROVER_ENDPOINTS = {
  generateTransactionProof: "/api/prove/transaction",
  generateWithdrawProof: "/api/prove/withdraw",
  generateSwapProof: "/api/prove/swap",
  health: "/api/health",
} as const;
