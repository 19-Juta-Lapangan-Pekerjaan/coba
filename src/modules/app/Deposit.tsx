"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useBalance,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import * as motion from "motion/react-client";
import {
  Shield,
  Wallet,
  ArrowDown,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { type Address, type Hex, formatUnits, parseUnits } from "viem";

import { useApp } from "@/src/contexts/AppContext";
import {
  SUPPORTED_TOKENS,
  ERC20_ABI,
  CONTRACT_ADDRESSES,
  DEFAULT_CHAIN_ID,
} from "@/src/lib/constants";
import type { TokenInfo } from "@/src/lib/constants";
import { getErrorMessage } from "@/src/lib/errorHandling";

// ============================================================================
// Types
// ============================================================================

type DepositStep = "input" | "approve" | "deposit" | "success";

interface DepositState {
  step: DepositStep;
  selectedToken: TokenInfo | null;
  amount: string;
  commitment: Hex | null;
  approveTxHash: Hex | null;
  depositTxHash: Hex | null;
  error: string | null;
  isApproving: boolean;
  isDepositing: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function Deposit() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { privacyWallet, refreshBalance } = useApp();

  // Get supported tokens for current chain
  const tokens = SUPPORTED_TOKENS[chainId ?? DEFAULT_CHAIN_ID] ?? [];

  // Local state
  const [state, setState] = useState<DepositState>({
    step: "input",
    selectedToken: tokens[0] ?? null,
    amount: "",
    commitment: null,
    approveTxHash: null,
    depositTxHash: null,
    error: null,
    isApproving: false,
    isDepositing: false,
  });

  // Token balance (ERC20)
  const { data: tokenBalance, refetch: refetchBalance } = useBalance({
    address,
    token: state.selectedToken?.address as Address | undefined,
  });

  // Native token balance (MNT on Mantle Sepolia)
  const { data: nativeBalance } = useBalance({
    address,
    // No token param = native balance
  });

  // =========================================================================
  // Helpers
  // =========================================================================

  const updateState = useCallback((updates: Partial<DepositState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const getContractAddress = useCallback(() => {
    const addresses =
      CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    return (
      addresses?.gelapShieldedAccount ??
      CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID].gelapShieldedAccount
    );
  }, [chainId]);

  const parseAmount = useCallback(() => {
    if (!state.amount || !state.selectedToken) return 0n;
    try {
      return parseUnits(state.amount, state.selectedToken.decimals);
    } catch {
      return 0n;
    }
  }, [state.amount, state.selectedToken]);

  const formatBalance = useCallback(() => {
    if (!tokenBalance) return "0";
    return formatUnits(tokenBalance.value, tokenBalance.decimals);
  }, [tokenBalance]);

  // =========================================================================
  // Check Allowance
  // =========================================================================

  const checkAllowance = useCallback(async (): Promise<bigint> => {
    if (!publicClient || !address || !state.selectedToken) return 0n;

    try {
      const allowance = await publicClient.readContract({
        address: state.selectedToken.address,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, getContractAddress()],
      });
      return allowance as bigint;
    } catch (error) {
      console.error("Failed to check allowance:", error);
      return 0n;
    }
  }, [publicClient, address, state.selectedToken, getContractAddress]);

  // =========================================================================
  // Approve Token
  // =========================================================================

  const handleApprove = useCallback(async () => {
    if (!walletClient || !publicClient || !state.selectedToken) return;

    const amount = parseAmount();
    if (amount === 0n) {
      updateState({ error: "Invalid amount" });
      return;
    }

    updateState({ isApproving: true, error: null });

    try {
      const hash = await walletClient.writeContract({
        address: state.selectedToken.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [getContractAddress(), amount],
        account: address!,
        chain: walletClient.chain,
      });

      updateState({ approveTxHash: hash });

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        updateState({ step: "deposit", isApproving: false });
      } else {
        updateState({ error: "Approval failed", isApproving: false });
      }
    } catch (error) {
      console.error("Approval failed:", error);
      updateState({
        error: getErrorMessage(error),
        isApproving: false,
      });
    }
  }, [
    walletClient,
    publicClient,
    state.selectedToken,
    address,
    parseAmount,
    getContractAddress,
    updateState,
  ]);

  // =========================================================================
  // Execute Deposit
  // =========================================================================

  const handleDeposit = useCallback(async () => {
    if (
      !walletClient ||
      !publicClient ||
      !privacyWallet ||
      !state.selectedToken
    )
      return;

    const amount = parseAmount();
    if (amount === 0n) {
      updateState({ error: "Invalid amount" });
      return;
    }

    updateState({ isDepositing: true, error: null });

    try {
      // Generate commitment
      const commitmentData = privacyWallet.createCommitment(amount);
      updateState({ commitment: commitmentData.commitment });

      // Execute deposit
      const { txHash } = await privacyWallet.executeDeposit(
        state.selectedToken.address,
        amount,
        commitmentData
      );

      updateState({
        depositTxHash: txHash,
        step: "success",
        isDepositing: false,
      });

      // Refresh balance
      await refreshBalance();
      refetchBalance();
    } catch (error) {
      console.error("Deposit failed:", error);
      updateState({
        error: getErrorMessage(error),
        isDepositing: false,
      });
    }
  }, [
    walletClient,
    publicClient,
    privacyWallet,
    state.selectedToken,
    parseAmount,
    updateState,
    refreshBalance,
    refetchBalance,
  ]);

  // =========================================================================
  // Handle Continue
  // =========================================================================

  const handleContinue = useCallback(async () => {
    const amount = parseAmount();
    if (amount === 0n) {
      updateState({ error: "Please enter a valid amount" });
      return;
    }

    // Check allowance
    const currentAllowance = await checkAllowance();

    if (currentAllowance >= amount) {
      // Already approved, go to deposit
      updateState({ step: "deposit" });
    } else {
      // Need approval
      updateState({ step: "approve" });
    }
  }, [parseAmount, checkAllowance, updateState]);

  // =========================================================================
  // Reset
  // =========================================================================

  const handleReset = useCallback(() => {
    setState({
      step: "input",
      selectedToken: tokens[0] ?? null,
      amount: "",
      commitment: null,
      approveTxHash: null,
      depositTxHash: null,
      error: null,
      isApproving: false,
      isDepositing: false,
    });
  }, [tokens]);

  // =========================================================================
  // Effects
  // =========================================================================

  // Refetch balance when selected token changes
  useEffect(() => {
    if (state.selectedToken) {
      refetchBalance();
    }
  }, [state.selectedToken, refetchBalance]);

  // =========================================================================
  // Render
  // =========================================================================

  if (!isConnected) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
          <Wallet className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">
            Connect Wallet
          </h2>
          <p className="text-zinc-500 text-sm">
            Please connect your wallet to deposit funds into the shielded pool.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">SHIELD DEPOSIT</h1>
        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded border border-purple-500/30 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          PRIVATE
        </span>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {["input", "approve", "deposit", "success"].map((step, index, arr) => {
          const stepOrder = ["input", "approve", "deposit", "success"];
          const currentStepIndex = stepOrder.indexOf(state.step);
          const thisStepIndex = stepOrder.indexOf(step);
          const isCompleted = thisStepIndex < currentStepIndex;
          const isCurrent = state.step === step;
          const isLastStep = index === arr.length - 1;
          const isSuccess = state.step === "success" && step === "success";

          return (
            <div
              key={step}
              className={`flex items-center gap-2 ${
                isLastStep ? "" : "flex-1"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isSuccess
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "bg-purple-500 text-white"
                    : isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {isCompleted || isSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 3 && (
                <div
                  className={`flex-1 h-0.5 ${
                    thisStepIndex < currentStepIndex
                      ? "bg-green-500"
                      : "bg-zinc-800"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
      >
        {/* Step: Input */}
        {state.step === "input" && (
          <>
            {/* Token Selection */}
            <div className="mb-6">
              <label className="block text-zinc-500 text-sm mb-2">
                SELECT TOKEN
              </label>
              <div className="flex gap-2">
                {tokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => updateState({ selectedToken: token })}
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      state.selectedToken?.address === token.address
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {token.symbol.charAt(0)}
                      </div>
                      <span className="text-white font-medium">
                        {token.symbol}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-zinc-500 text-sm mb-2">
                AMOUNT TO DEPOSIT
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={state.amount}
                  onChange={(e) =>
                    updateState({ amount: e.target.value, error: null })
                  }
                  placeholder="0.00"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-4 py-4 pr-24 text-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={() => updateState({ amount: formatBalance() })}
                    className="text-purple-400 text-xs hover:text-purple-300"
                  >
                    MAX
                  </button>
                  <span className="text-zinc-500">
                    {state.selectedToken?.symbol}
                  </span>
                </div>
              </div>
              <p className="text-zinc-600 text-xs mt-2">
                Balance: {formatBalance()} {state.selectedToken?.symbol}
              </p>
              {nativeBalance && (
                <p className="text-zinc-500 text-xs mt-1">
                  WMNT: {nativeBalance.formatted} {nativeBalance.symbol}
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium mb-1">
                    What happens when you deposit?
                  </p>
                  <p className="text-zinc-500 text-xs">
                    Your tokens are transferred to the shielded pool. A
                    cryptographic commitment is created that only you can spend.
                    Your balance becomes invisible to the public.
                  </p>
                </div>
              </div>
            </div>

            {/* Error */}
            {state.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{state.error}</span>
              </div>
            )}

            {/* Continue Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleContinue}
              disabled={!state.amount || parseAmount() === 0n}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-xl text-white font-medium transition-all"
            >
              CONTINUE
            </motion.button>
          </>
        )}

        {/* Step: Approve */}
        {state.step === "approve" && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {state.isApproving ? (
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                ) : (
                  <Check className="w-8 h-8 text-purple-400" />
                )}
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Approve Token Spending
              </h2>
              <p className="text-zinc-500 text-sm">
                Allow the Gelap contract to transfer your{" "}
                {state.selectedToken?.symbol}.
              </p>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Amount</span>
                <span className="text-white">
                  {state.amount} {state.selectedToken?.symbol}
                </span>
              </div>
            </div>

            {state.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{state.error}</span>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleApprove}
              disabled={state.isApproving}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
            >
              {state.isApproving && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {state.isApproving ? "APPROVING..." : "APPROVE"}
            </motion.button>
          </>
        )}

        {/* Step: Deposit */}
        {state.step === "deposit" && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {state.isDepositing ? (
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                ) : (
                  <ArrowDown className="w-8 h-8 text-purple-400" />
                )}
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Confirm Deposit
              </h2>
              <p className="text-zinc-500 text-sm">
                Your tokens will be shielded in the private pool.
              </p>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Token</span>
                <span className="text-white">
                  {state.selectedToken?.symbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Amount</span>
                <span className="text-white">{state.amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Destination</span>
                <span className="text-purple-400">Shielded Pool</span>
              </div>
            </div>

            {state.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{state.error}</span>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleDeposit}
              disabled={state.isDepositing}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
            >
              {state.isDepositing && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {state.isDepositing
                ? "DEPOSITING..."
                : "DEPOSIT TO SHIELDED POOL"}
            </motion.button>
          </>
        )}

        {/* Step: Success */}
        {state.step === "success" && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Deposit Successful!
              </h2>
              <p className="text-zinc-500 text-sm">
                Your {state.amount} {state.selectedToken?.symbol} is now
                shielded.
              </p>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Amount Shielded</span>
                <span className="text-green-400">
                  {state.amount} {state.selectedToken?.symbol}
                </span>
              </div>
              {state.depositTxHash && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-zinc-500">Transaction</span>
                  <a
                    href={`https://sepolia.mantlescan.xyz/tx/${state.depositTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    View
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {state.commitment && (
                <div className="pt-2 border-t border-zinc-700">
                  <span className="text-zinc-500 text-xs block mb-1">
                    Commitment (keep private)
                  </span>
                  <code className="text-xs text-zinc-400 break-all">
                    {state.commitment.slice(0, 20)}...
                    {state.commitment.slice(-20)}
                  </code>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleReset}
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-white font-medium transition-all"
            >
              MAKE ANOTHER DEPOSIT
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}
