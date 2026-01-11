/**
 * Mock ZK Proof Generator for Gelap Shielded Transactions
 *
 * This utility generates mock proofs that work with MockSP1Verifier
 * for frontend development and testing without requiring actual SP1 zkVM proofs.
 *
 */

import { keccak256, encodeAbiParameters, toHex, type Address } from 'viem';

// ============================================================================
// Types matching GelapShieldedAccount.sol structures
// ============================================================================

export interface TransactProofData {
  publicInputs: `0x${string}`;
  proofBytes: `0x${string}`;
}

export interface TransactParams {
  newRoot?: `0x${string}`;
  nullifiers?: `0x${string}`[];
  newCommitments?: `0x${string}`[];
  keyImage?: `0x${string}`;
}

export interface WithdrawParams {
  token: Address;
  amount: bigint;
  receiver: Address;
  newRoot?: `0x${string}`;
  nullifiers?: `0x${string}`[];
  newCommitments?: `0x${string}`[];
}

export interface SwapParams {
  newRoot?: `0x${string}`;
  nullifiers?: `0x${string}`[]; // Must be exactly 2
  newCommitments?: `0x${string}`[];
  orderAKeyImage?: `0x${string}`;
  orderBKeyImage?: `0x${string}`;
}

// ============================================================================
// Mock Proof Generators
// ============================================================================

/**
 * Creates a mock proof for the transact() function
 *
 * @example
 * ```ts
 * const proof = createMockTransactProof({
 *   nullifiers: [keccak256(toHex('my_nullifier'))],
 *   newCommitments: [keccak256(toHex('my_commitment'))]
 * });
 *
 * await writeContract({
 *   address: CONTRACT_ADDRESS,
 *   abi: gelapAbi,
 *   functionName: 'transact',
 *   args: [proof.publicInputs, proof.proofBytes]
 * });
 * ```
 */
export function createMockTransactProof(params: TransactParams = {}): TransactProofData {
  const publicInputs = encodeAbiParameters(
    [
      { name: 'newRoot', type: 'bytes32' },
      { name: 'nullifiers', type: 'bytes32[]' },
      { name: 'newCommitments', type: 'bytes32[]' },
      { name: 'keyImage', type: 'bytes32' },
    ],
    [
      params.newRoot ?? generateMockRoot(),
      params.nullifiers ?? [],
      params.newCommitments ?? [],
      params.keyImage ?? generateMockKeyImage(),
    ],
  );

  return {
    publicInputs,
    proofBytes: generateMockProofBytes('transact'),
  };
}

/**
 * Creates a mock proof for the withdraw() function
 *
 * @example
 * ```ts
 * const proof = createMockWithdrawProof({
 *   token: '0x...',
 *   amount: parseEther('100'),
 *   receiver: userAddress,
 *   nullifiers: [keccak256(toHex('spent_note'))]
 * });
 *
 * await writeContract({
 *   address: CONTRACT_ADDRESS,
 *   abi: gelapAbi,
 *   functionName: 'withdraw',
 *   args: [proof.publicInputs, proof.proofBytes, receiver]
 * });
 * ```
 */
export function createMockWithdrawProof(params: WithdrawParams): TransactProofData {
  const publicInputs = encodeAbiParameters(
    [
      { name: 'newRoot', type: 'bytes32' },
      { name: 'nullifiers', type: 'bytes32[]' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'newCommitments', type: 'bytes32[]' },
    ],
    [
      params.newRoot ?? generateMockRoot(),
      params.nullifiers ?? [generateMockNullifier()],
      params.token,
      params.amount,
      params.receiver,
      params.newCommitments ?? [],
    ],
  );

  return {
    publicInputs,
    proofBytes: generateMockProofBytes('withdraw'),
  };
}

/**
 * Creates a mock proof for the executeSwap() function
 *
 * @example
 * ```ts
 * const proof = createMockSwapProof({
 *   nullifiers: [
 *     keccak256(toHex('order_a_nullifier')),
 *     keccak256(toHex('order_b_nullifier'))
 *   ],
 *   newCommitments: [
 *     keccak256(toHex('output_a')),
 *     keccak256(toHex('output_b'))
 *   ]
 * });
 *
 * await writeContract({
 *   address: CONTRACT_ADDRESS,
 *   abi: gelapAbi,
 *   functionName: 'executeSwap',
 *   args: [proof.publicInputs, proof.proofBytes]
 * });
 * ```
 */
export function createMockSwapProof(params: SwapParams = {}): TransactProofData {
  // Ensure exactly 2 nullifiers for swap
  const nullifiers = params.nullifiers ?? [generateMockNullifier('order_a'), generateMockNullifier('order_b')];

  if (nullifiers.length !== 2) {
    throw new Error('Swap requires exactly 2 nullifiers (one per order)');
  }

  const publicInputs = encodeAbiParameters(
    [
      { name: 'newRoot', type: 'bytes32' },
      { name: 'nullifiers', type: 'bytes32[]' },
      { name: 'newCommitments', type: 'bytes32[]' },
      { name: 'orderAKeyImage', type: 'bytes32' },
      { name: 'orderBKeyImage', type: 'bytes32' },
    ],
    [
      params.newRoot ?? generateMockRoot(),
      nullifiers,
      params.newCommitments ?? [],
      params.orderAKeyImage ?? generateMockKeyImage('order_a'),
      params.orderBKeyImage ?? generateMockKeyImage('order_b'),
    ],
  );

  return {
    publicInputs,
    proofBytes: generateMockProofBytes('swap'),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a random mock Merkle root
 */
function generateMockRoot(): `0x${string}` {
  return keccak256(toHex(`mock_root_${Date.now()}_${Math.random()}`));
}

/**
 * Generates a random mock nullifier
 */
function generateMockNullifier(prefix = 'nullifier'): `0x${string}` {
  return keccak256(toHex(`${prefix}_${Date.now()}_${Math.random()}`));
}

/**
 * Generates a random mock key image
 */
function generateMockKeyImage(prefix = 'key_image'): `0x${string}` {
  return keccak256(toHex(`${prefix}_${Date.now()}_${Math.random()}`));
}

/**
 * Generates mock proof bytes (can be any valid hex when using MockSP1Verifier)
 */
function generateMockProofBytes(type: string): `0x${string}` {
  const timestamp = Date.now().toString(16);
  const random = Math.floor(Math.random() * 0xffffffff).toString(16);
  return `0x${type}${timestamp}${random}` as `0x${string}`;
}

// ============================================================================
// Utility: Generate Commitment Hash
// ============================================================================

/**
 * Generates a mock commitment hash from value and blinding factor
 * In production, this should be a Pedersen commitment
 *
 * For now, we use keccak256(value || blindingFactor)
 */
export function createMockCommitment(
  value: bigint,
  blindingFactor: `0x${string}` = keccak256(toHex(`blinding_${Math.random()}`)),
): `0x${string}` {
  return keccak256(encodeAbiParameters([{ type: 'uint256' }, { type: 'bytes32' }], [value, blindingFactor]));
}

// ============================================================================
// Exports
// ============================================================================

export const mockProofs = {
  transact: createMockTransactProof,
  withdraw: createMockWithdrawProof,
  swap: createMockSwapProof,
  commitment: createMockCommitment,
  helpers: {
    generateMockRoot,
    generateMockNullifier,
    generateMockKeyImage,
    generateMockProofBytes,
  },
};
