# Gelap Privacy — Shielded DEX Frontend

Gelap Privacy is the frontend application for the Gelap shielded DEX, enabling private transactions on Mantle with SP1 zkVM proofs.

## Overview

This application provides a user interface for:
- **Shielded Deposits**: Move tokens into the private pool
- **Private Transfers**: Send tokens privately between shielded addresses
- **Withdrawals**: Exit the shielded pool back to public addresses
- **Treasury Rates**: Real-time yield data from DeFi protocols

> **Note**: All private transactions use Pedersen commitments for amount hiding, stealth addresses for recipient hiding, and SP1 zkVM proofs for validity.

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm run dev
```

Navigate to `http://localhost:3000/app` to access the shielded DEX.

### Build

```bash
pnpm run build
```

## Architecture

### Wallet SDK (`/src/wallet-sdk/`)

The wallet SDK provides all cryptographic and blockchain interactions:

| Module | Purpose |
|--------|---------|
| `wallet.ts` | Main `PrivacyWallet` class combining all functionality |
| `commitment.ts` | Pedersen commitment generation and verification |
| `keyDerivation.ts` | View/spend key derivation from wallet signatures |
| `stealthAddress.ts` | Stealth address generation for private receiving |
| `merkleTree.ts` | Client-side Merkle tree for tracking commitments |
| `contractService.ts` | Smart contract interaction wrapper |

### Key Generation Flow

When a user connects their wallet, the following happens:

1. **TEE Environment Init**: Setup secure context
2. **Sign Message**: User signs a message to derive privacy keys
3. **Key Derivation**: Extract view and spend keys from signature
4. **Stealth Address**: Compute receiving address from keys
5. **Chain Sync**: Fetch existing notes from contract events

```typescript
// Key derivation from signature
const viewKey = keccak256(signature + "view");
const spendKey = keccak256(signature + "spend");
```

## User Flows

### Deposit Flow

1. **Input**: User selects token and amount
2. **Approve**: ERC20 approval for the Gelap contract
3. **Deposit**: Generate commitment, call contract
4. **Success**: Note stored locally, balance updated

```
User → [Select Token] → [Enter Amount] → [Approve ERC20] → [Deposit] → Shielded Pool
```

### Withdrawal Flow

1. **Select Notes**: Choose UTXOs to spend
2. **Amount**: Enter withdrawal amount
3. **Confirm**: Generate ZK proof (via prover service)
4. **Success**: Public funds received

```
Shielded Pool → [Select Notes] → [ZK Proof] → [Verify] → Public Address
```

## Smart Contract Integration

### Contract Address (Mantle Sepolia)

```
GelapShieldedAccount: 0x54EC23CBCE1A9d33F05C4d3d79Ec28Aff3c8ce8D
MockSP1Verifier: 0x79117dbB5A08B03cD796d06EdeEC6e0f2c554f4B
```

### Key Functions

```solidity
// Deposit tokens into shielded pool
function deposit(address token, uint256 amount, bytes32 commitment) external;

// Private transaction (requires ZK proof)
function transact(bytes calldata publicInputs, bytes calldata proofBytes) external;

// Withdraw to public address (requires ZK proof)
function withdraw(bytes calldata publicInputs, bytes calldata proofBytes, address receiver) external;
```

### Events to Track

| Event | Description |
|-------|-------------|
| `AccountUpdated(bytes32 commitment, bytes encryptedMemo)` | New note created |
| `TransactionExecuted(...)` | Private transaction completed |
| `WithdrawExecuted(address receiver, ...)` | Withdrawal completed |

## Hooks

### `usePrivacyWallet`

Main hook for privacy wallet state:

```typescript
const { 
  privacyWallet,      // PrivacyWallet instance
  shieldedBalance,    // Total shielded balance
  unspentNotes,       // Available UTXOs
  isLoading,          // Loading state
  refresh,            // Refresh balance
} = usePrivacyWallet();
```

### `useTreasuryRates`

Fetch live yield rates from DeFiLlama:

```typescript
const {
  ustbYield,       // T-Bill yield proxy
  usdcLend,        // USDC lending rate
  privateCredit,   // Private credit yield
  isLoading,
  refresh,
} = useTreasuryRates();
```

### `useContractEvents`

Subscribe to contract events:

```typescript
const { events } = useContractEvents({
  fromBlock: 0n,
  pollingInterval: 10000, // 10s
});
```

## Environment Variables

```env
# Prover service URL (for ZK proof generation)
NEXT_PUBLIC_PROVER_API_URL=http://localhost:3001

# WalletConnect project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Prover Service Integration

Withdrawals and private transfers require ZK proofs from the SP1 prover service.

### Expected API Endpoints

```
POST /api/prove/transaction
POST /api/prove/withdraw
POST /api/prove/swap
```

### Request Body

```json
{
  "inputs": [...],           // Input notes (nullifiers)
  "outputs": [...],          // Output commitments
  "merkleProofs": [...],     // Inclusion proofs
  "token": "0x...",
  "amount": "1000000"
}
```

### Response

```json
{
  "vkey": "0x...",
  "publicValues": "0x...",
  "proof": "0x..."
}
```

## Merkle Tree Specification

The client-side Merkle tree must match the on-chain implementation:

| Property | Value |
|----------|-------|
| Hash Function | `keccak256` |
| Tree Depth | 32 levels |
| Node Index | `(level << 32) | index` |
| Zero Hash[0] | `keccak256(abi.encodePacked(uint256(0)))` |

## Commitment Format

Pedersen commitments are used for amount hiding:

```
Commitment = H * amount + G * blinding
```

Where:
- `H` = Secondary generator point on secp256k1
- `G` = Standard generator point
- `blinding` = Random 32-byte scalar

## Local Storage

The wallet persists state to localStorage:

```
gelap_wallet_keys_{address}      // Encrypted view/spend keys
gelap_wallet_notes_{address}     // UTXOs/notes
gelap_wallet_tree_{address}      // Merkle tree state
gelap_wallet_lastBlock_{address} // Last synced block
```

## Testing

### Manual Testing Checklist

1. [ ] Connect wallet via RainbowKit
2. [ ] Generate privacy wallet (sign messages)
3. [ ] Deposit tokens to shielded pool
4. [ ] Check shielded balance on Dashboard
5. [ ] Attempt withdrawal (prover required)
6. [ ] Verify transaction on block explorer

### Build Verification

```bash
pnpm run build
# Should compile with no TypeScript errors
```

## Troubleshooting

### RPC Errors (503)

If you see "no backends available":
- Check you're on the correct network (Mantle Sepolia for testnet)
- Contract may not be deployed on mainnet yet

### Signature Rejected

If wallet generation fails:
- User rejected the signature request
- Click "Retry Generation" button

### Prover Unavailable

Withdrawals require a running prover service:
- Set `NEXT_PUBLIC_PROVER_API_URL` in `.env.local`
- Mock proofs are used in development
