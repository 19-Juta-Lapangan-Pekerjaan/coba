/**
 * Example: Using Mock Proofs with Gelap Shielded Contract
 *
 * This file demonstrates how to use the mock proof utilities in React components
 * to interact with the GelapShieldedAccount contract during development.
 */

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { type Address } from "viem";
import {
  createMockTransactProof,
  createMockWithdrawProof,
  createMockSwapProof,
} from "./mockProofs";

import { GELAP_SHIELDED_ACCOUNT_ABI } from "@/src/lib/constants";

// ============================================================================
// Example 1: Private Transaction (transact)
// ============================================================================

export function usePrivateTransfer() {
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const executePrivateTransfer = async (
    commitments: `0x${string}`[],
    nullifiers: `0x${string}`[]
  ) => {
    // Generate mock proof with data
    const proof = createMockTransactProof({
      newCommitments: commitments,
      nullifiers: nullifiers,
    });

    // Call contract
    await writeContract({
      address: process.env.NEXT_PUBLIC_GELAP_CONTRACT_ADDRESS as Address,
      abi: GELAP_SHIELDED_ACCOUNT_ABI,
      functionName: "transact",
      args: [proof.publicInputs, proof.proofBytes],
    });
  };

  return {
    executePrivateTransfer,
    isLoading,
    isSuccess,
    hash,
  };
}

// ============================================================================
// Example 2: Shielded Withdrawal
// ============================================================================

export function useShieldedWithdraw() {
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const executeWithdraw = async (
    tokenAddress: Address,
    amount: bigint,
    receiverAddress: Address,
    spentNullifiers: `0x${string}`[]
  ) => {
    // Generate mock withdrawal proof
    const proof = createMockWithdrawProof({
      token: tokenAddress,
      amount: amount,
      receiver: receiverAddress,
      nullifiers: spentNullifiers,
    });

    // Call contract - note the receiver must match the one in proof
    await writeContract({
      address: process.env.NEXT_PUBLIC_GELAP_CONTRACT_ADDRESS as Address,
      abi: GELAP_SHIELDED_ACCOUNT_ABI,
      functionName: "withdraw",
      args: [proof.publicInputs, proof.proofBytes, receiverAddress],
    });
  };

  return {
    executeWithdraw,
    isLoading,
    isSuccess,
    hash,
  };
}

// ============================================================================
// Example 3: Darkpool Swap
// ============================================================================

export function useDarkpoolSwap() {
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const executeSwap = async (
    orderANullifier: `0x${string}`,
    orderBNullifier: `0x${string}`,
    outputCommitments: `0x${string}`[]
  ) => {
    // Generate mock swap proof with exactly 2 nullifiers
    const proof = createMockSwapProof({
      nullifiers: [orderANullifier, orderBNullifier],
      newCommitments: outputCommitments,
    });

    // Call contract
    await writeContract({
      address: process.env.NEXT_PUBLIC_GELAP_CONTRACT_ADDRESS as Address,
      abi: GELAP_SHIELDED_ACCOUNT_ABI,
      functionName: "executeSwap",
      args: [proof.publicInputs, proof.proofBytes],
    });
  };

  return {
    executeSwap,
    isLoading,
    isSuccess,
    hash,
  };
}

// ============================================================================
// Example 4: Integration with existing CommitmentGenerator
// ============================================================================

import { CommitmentGenerator } from "./commitment";
import { keccak256, toHex } from "viem";

export function usePrivateTransferWithCommitments() {
  const { executePrivateTransfer, isLoading } = usePrivateTransfer();

  /**
   * Create a balanced private transfer
   * @param inputAmount - Total input amount
   * @param outputAmounts - Array of output amounts (must sum to inputAmount)
   */
  const createAndExecuteTransfer = async (
    inputAmount: bigint,
    outputAmounts: bigint[]
  ) => {
    // Use existing CommitmentGenerator to create balanced commitments
    const { inputs, outputs } = CommitmentGenerator.createBalancedCommitments(
      inputAmount,
      outputAmounts
    );

    // Generate mock nullifiers for the inputs (in production, these come from spent notes)
    const nullifiers = inputs.map((input) =>
      keccak256(toHex(`nullifier_${input.commitment}`))
    );

    // Extract commitment hashes for outputs
    const newCommitments = outputs.map((output) => output.commitment);

    // Execute with mock proof
    await executePrivateTransfer(newCommitments, nullifiers);
  };

  return {
    createAndExecuteTransfer,
    isLoading,
  };
}

// ============================================================================
// Example 5: React Component Integration
// ============================================================================

export function PrivateTransferButton() {
  const { createAndExecuteTransfer, isLoading } =
    usePrivateTransferWithCommitments();

  const handleTransfer = async () => {
    try {
      // Example: Transfer 100 units split into two outputs of 60 and 40
      await createAndExecuteTransfer(100n, [60n, 40n]);

      console.log("Private transfer successful!");
    } catch (error) {
      console.error("Transfer failed:", error);
    }
  };

  return (
    <button onClick={handleTransfer} disabled={isLoading}>
      {isLoading ? "Processing..." : "Execute Private Transfer"}
    </button>
  );
}
