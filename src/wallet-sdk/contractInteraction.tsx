/**
 * Complete Guide: Interacting with Gelap Shielded Contract
 *
 * This file shows the complete flow:
 * 1. Deposit funds into shielded pool
 * 2. Execute private transfers
 * 3. Withdraw funds to public address
 */

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi';
import { parseEther, type Address, keccak256, toHex } from 'viem';
import { CommitmentGenerator } from './commitment';
import { createMockTransactProof, createMockWithdrawProof } from './mockProofs';
import { CONTRACT_ADDRESSES, GELAP_SHIELDED_ACCOUNT_ABI, DEFAULT_CHAIN_ID } from '@/lib/constants';

// Helper to get contract address for current chain
function getContractAddress(chainId: number): Address {
  return CONTRACT_ADDRESSES[chainId]?.gelapShieldedAccount || CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID].gelapShieldedAccount;
}

const TEST_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS as Address;

// ============================================================================
// STEP 1: DEPOSIT - Put funds into the shielded pool
// ============================================================================

export function useDeposit() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });
  const chainId = useChainId();

  /**
   * Deposits ERC20 tokens into the shielded pool
   *
   * @param tokenAddress - ERC20 token to deposit
   * @param amount - Amount to deposit (in wei/smallest unit)
   * @returns commitment hash that represents shielded balance
   */
  const deposit = async (tokenAddress: Address, amount: bigint) => {
    // 1. Create a commitment for the deposit
    const commitment = CommitmentGenerator.createCommitment(amount);

    console.log('Created commitment:', {
      commitment: commitment.commitment,
      amount: commitment.amount.toString(),
      blinding: commitment.blinding,
    });

    // 2. Optionally encrypt memo (simplified version)
    const encryptedMemo = toHex('Deposit of ' + amount.toString());

    // 3. Call contract deposit function
    await writeContract({
      address: getContractAddress(chainId),
      abi: GELAP_SHIELDED_ACCOUNT_ABI,
      functionName: 'deposit',
      args: [tokenAddress, amount, commitment.commitment as `0x${string}`, encryptedMemo],
    });

    // 4. Save commitment data (you'll need this for spending later)
    // In production, store this encrypted in user wallet
    return commitment;
  };

  return {
    deposit,
    isPending,
    isLoading,
    isSuccess,
    hash,
  };
}

// ============================================================================
// STEP 2: PRIVATE TRANSFER - Transfer funds within shielded pool
// ============================================================================

export function usePrivateTransfer() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });
  const chainId = useChainId();

  /**
   * Execute a private transfer (no one knows sender, receiver, or amount)
   *
   * @param inputCommitments - existing commitments (what you're spending)
   * @param outputAmounts - How to split the funds (e.g., [60, 40] for two recipients)
   */
  const executePrivateTransfer = async (
    inputCommitments: Array<{ commitment: string; amount: bigint; blinding: string }>,
    outputAmounts: bigint[],
  ) => {
    // 1. Calculate total input amount
    const totalInput = inputCommitments.reduce((sum, c) => sum + c.amount, 0n);
    const totalOutput = outputAmounts.reduce((sum, amt) => sum + amt, 0n);

    if (totalInput !== totalOutput) {
      throw new Error('Input and output amounts must match!');
    }

    // 2. Generate balanced output commitments
    const { outputs } = CommitmentGenerator.createBalancedCommitments(totalInput, outputAmounts);

    // 3. Create nullifiers for inputs (marks them as spent)
    const nullifiers = inputCommitments.map((input) => keccak256(toHex(`nullifier_${input.commitment}_${Date.now()}`)));

    // 4. Generate mock ZK proof
    const proof = createMockTransactProof({
      newCommitments: outputs.map((o) => o.commitment as `0x${string}`),
      nullifiers: nullifiers,
    });

    console.log('Private transfer proof generated:', {
      nullifiers,
      newCommitments: outputs.map((o) => o.commitment),
      outputAmounts: outputAmounts.map((a) => a.toString()),
    });

    // 5. Submit to contract
    await writeContract({
      address: getContractAddress(chainId),
      abi: GELAP_SHIELDED_ACCOUNT_ABI,
      functionName: 'transact',
      args: [proof.publicInputs, proof.proofBytes],
    });

    // 6. Return new commitments (recipients can scan for these)
    return outputs;
  };

  return {
    executePrivateTransfer,
    isPending,
    isLoading,
    isSuccess,
    hash,
  };
}

// ============================================================================
// STEP 3: WITHDRAW - Exit shielded pool to public address
// ============================================================================

export function useWithdraw() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { address } = useAccount();
  const chainId = useChainId();

  /**
   * Withdraw funds from shielded pool to a public address
   *
   * @param commitment - commitment to spend
   * @param amount - Amount to withdraw
   * @param receiverAddress - Public address to receive funds
   */
  const withdraw = async (
    commitment: { commitment: string; amount: bigint; blinding: string },
    amount: bigint,
    receiverAddress: Address,
  ) => {
    // 1. Generate nullifier for the spent commitment
    const nullifier = keccak256(toHex(`withdraw_nullifier_${commitment.commitment}_${Date.now()}`));

    // 2. Generate mock withdrawal proof
    const proof = createMockWithdrawProof({
      token: TEST_TOKEN_ADDRESS,
      amount: amount,
      receiver: receiverAddress,
      nullifiers: [nullifier],
    });

    console.log('Withdrawal proof generated:', {
      amount: amount.toString(),
      receiver: receiverAddress,
      nullifier,
    });

    // 3. Submit to contract
    await writeContract({
      address: getContractAddress(chainId),
      abi: GELAP_SHIELDED_ACCOUNT_ABI,
      functionName: 'withdraw',
      args: [proof.publicInputs, proof.proofBytes, receiverAddress],
    });
  };

  return {
    withdraw,
    isPending,
    isLoading,
    isSuccess,
    hash,
  };
}

// ============================================================================
// COMPLETE EXAMPLE: React Component
// ============================================================================

export function ShieldedTransferDemo() {
  const [myCommitments, setMyCommitments] = useState<
    Array<{
      commitment: string;
      amount: bigint;
      blinding: string;
    }>
  >([]);

  const { deposit, isPending: isDepositing } = useDeposit();
  const { executePrivateTransfer, isPending: isTransferring } = usePrivateTransfer();
  const { withdraw, isPending: isWithdrawing } = useWithdraw();
  const { address } = useAccount();

  // STEP 1: Deposit 100 tokens
  const handleDeposit = async () => {
    try {
      const commitment = await deposit(TEST_TOKEN_ADDRESS, parseEther('100'));

      // Save commitment (in production, encrypt and store securely)
      setMyCommitments([...myCommitments, commitment]);

      alert('Deposit successful! Funds are now private.');
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  // STEP 2: Private transfer - split 100 into 60 and 40
  const handlePrivateTransfer = async () => {
    if (myCommitments.length === 0) {
      alert('No commitments to spend! Deposit first.');
      return;
    }

    try {
      const newCommitments = await executePrivateTransfer(
        [myCommitments[0]], // Spend first commitment
        [parseEther('60'), parseEther('40')], // Split into two outputs
      );

      alert('Private transfer complete! No one knows who sent what to whom.');
      console.log('New commitments created:', newCommitments);
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  // STEP 3: Withdraw to public address
  const handleWithdraw = async () => {
    if (!address || myCommitments.length === 0) {
      alert('Connect wallet and deposit first!');
      return;
    }

    try {
      await withdraw(
        myCommitments[0],
        parseEther('50'), // Withdraw 50 tokens
        address, // To user public address
      );

      alert('Withdrawal complete! Funds are now public.');
    } catch (error) {
      console.error('Withdrawal failed:', error);
    }
  };

  return (
    <div className='p-6 space-y-4'>
      <h2 className='text-2xl font-bold'>Shielded Transfer Demo</h2>

      <div className='bg-gray-100 p-4 rounded'>
        <p className='text-sm'>User Shielded Balance: {myCommitments.length} commitments</p>
      </div>

      <div className='space-y-2'>
        <button
          onClick={handleDeposit}
          disabled={isDepositing}
          className='w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 disabled:opacity-50'>
          {isDepositing ? 'Depositing...' : '1. Deposit 100 Tokens'}
        </button>

        <button
          onClick={handlePrivateTransfer}
          disabled={isTransferring || myCommitments.length === 0}
          className='w-full bg-green-500 text-white p-3 rounded hover:bg-green-600 disabled:opacity-50'>
          {isTransferring ? 'Transferring...' : '2. Private Transfer (60 + 40)'}
        </button>

        <button
          onClick={handleWithdraw}
          disabled={isWithdrawing || myCommitments.length === 0}
          className='w-full bg-purple-500 text-white p-3 rounded hover:bg-purple-600 disabled:opacity-50'>
          {isWithdrawing ? 'Withdrawing...' : '3. Withdraw 50 Tokens'}
        </button>
      </div>

      <div className='bg-yellow-50 border border-yellow-200 p-4 rounded text-sm'>
        <p className='font-semibold'>Quick Setup:</p>
        <ol className='list-decimal ml-5 mt-2 space-y-1'>
          <li>Deploy contract with MockSP1Verifier</li>
          <li>Set NEXT_PUBLIC_GELAP_CONTRACT_ADDRESS in .env</li>
          <li>
            Approve token first: <code>token.approve(contractAddress, amount)</code>
          </li>
          <li>Then use this demo!</li>
        </ol>
      </div>
    </div>
  );
}

// ============================================================================
// Contract ABI - Now imported from @/lib/constants
// ============================================================================
// The full ABI including deposit, transact, withdraw, executeSwap, and all events
// is defined in src/lib/constants.ts as GELAP_SHIELDED_ACCOUNT_ABI
