"use client";

import { useState, useCallback, useMemo } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import * as motion from "motion/react-client";
import {
  Shield,
  Wallet,
  ArrowUpRight,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Info,
} from "lucide-react";
import { type Hex, formatUnits, parseUnits } from "viem";

import { useApp } from "@/src/contexts/AppContext";
import { SUPPORTED_TOKENS, DEFAULT_CHAIN_ID } from "@/src/lib/constants";
import type { TokenInfo } from "@/src/lib/constants";
import type { Note } from "@/src/wallet-sdk";

// ============================================================================
// Types
// ============================================================================

type WithdrawStep = "select" | "amount" | "confirm" | "generating" | "success";

interface WithdrawState {
  step: WithdrawStep;
  selectedNotes: Note[];
  withdrawAmount: string;
  receiver: string;
  selectedToken: TokenInfo | null;
  txHash: Hex | null;
  error: string | null;
  isProcessing: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function Withdraw() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { privacyWallet, unspentNotes, shieldedBalance, refreshBalance } =
    useApp();

  // Get supported tokens
  const tokens = SUPPORTED_TOKENS[chainId ?? DEFAULT_CHAIN_ID] ?? [];

  // Local state
  const [state, setState] = useState<WithdrawState>({
    step: "select",
    selectedNotes: [],
    withdrawAmount: "",
    receiver: address ?? "",
    selectedToken: tokens[0] ?? null,
    txHash: null,
    error: null,
    isProcessing: false,
  });

  // =========================================================================
  // Helpers
  // =========================================================================

  const updateState = useCallback((updates: Partial<WithdrawState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Calculate total from selected notes
  const selectedTotal = useMemo(() => {
    return state.selectedNotes.reduce((sum, note) => sum + note.amount, 0n);
  }, [state.selectedNotes]);

  // Parse withdraw amount
  const parseAmount = useCallback(() => {
    if (!state.withdrawAmount || !state.selectedToken) return 0n;
    try {
      return parseUnits(state.withdrawAmount, state.selectedToken.decimals);
    } catch {
      return 0n;
    }
  }, [state.withdrawAmount, state.selectedToken]);

  // Format amount for display
  const formatAmount = useCallback((amount: bigint, decimals: number = 18) => {
    return formatUnits(amount, decimals);
  }, []);

  // =========================================================================
  // Note Selection
  // =========================================================================

  const toggleNoteSelection = useCallback((note: Note) => {
    setState((prev) => {
      const isSelected = prev.selectedNotes.some(
        (n) => n.commitment === note.commitment
      );

      if (isSelected) {
        return {
          ...prev,
          selectedNotes: prev.selectedNotes.filter(
            (n) => n.commitment !== note.commitment
          ),
        };
      } else {
        return {
          ...prev,
          selectedNotes: [...prev.selectedNotes, note],
        };
      }
    });
  }, []);

  const selectAllNotes = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedNotes: [...unspentNotes],
    }));
  }, [unspentNotes]);

  // =========================================================================
  // Actions
  // =========================================================================

  const handleContinueToAmount = useCallback(() => {
    if (state.selectedNotes.length === 0) {
      updateState({ error: "Please select at least one note to withdraw" });
      return;
    }
    updateState({ step: "amount", error: null });
  }, [state.selectedNotes, updateState]);

  const handleContinueToConfirm = useCallback(() => {
    const amount = parseAmount();
    if (amount === 0n) {
      updateState({ error: "Please enter a valid amount" });
      return;
    }
    if (amount > selectedTotal) {
      updateState({ error: "Amount exceeds selected notes" });
      return;
    }
    if (!state.receiver) {
      updateState({ error: "Please enter a receiver address" });
      return;
    }
    updateState({ step: "confirm", error: null });
  }, [parseAmount, selectedTotal, state.receiver, updateState]);

  const handleWithdraw = useCallback(async () => {
    if (
      !privacyWallet ||
      !walletClient ||
      !publicClient ||
      !state.selectedToken
    )
      return;

    const withdrawAmount = parseAmount();
    if (withdrawAmount === 0n) {
      updateState({ error: "Invalid withdrawal amount" });
      return;
    }

    updateState({ isProcessing: true, step: "generating", error: null });

    try {
      // Import mock proof generator
      const { createMockWithdrawProof } = await import(
        "@/src/wallet-sdk/mockProofs"
      );

      // Generate nullifiers from selected notes
      const nullifiers = state.selectedNotes.map((note) => note.nullifier);

      // Generate mock withdrawal proof
      const proof = createMockWithdrawProof({
        token: state.selectedToken.address,
        amount: withdrawAmount,
        receiver: state.receiver as `0x${string}`,
        nullifiers: nullifiers as `0x${string}`[],
      });

      // Get contract service
      const contractService = privacyWallet.getContractService();
      if (!contractService) {
        throw new Error("Contract service not initialized");
      }

      // Execute withdrawal transaction
      const txHash = await contractService.withdraw({
        publicInputs: proof.publicInputs,
        proofBytes: proof.proofBytes,
        receiver: state.receiver as `0x${string}`,
      });

      // Wait for transaction confirmation
      await contractService.waitForTransaction(txHash);

      // Mark notes as spent
      privacyWallet.markNotesSpent(nullifiers as `0x${string}`[]);

      updateState({
        txHash,
        step: "success",
        isProcessing: false,
      });

      // Refresh balance
      await refreshBalance();
    } catch (error) {
      console.error("Withdraw failed:", error);
      updateState({
        error: error instanceof Error ? error.message : "Withdrawal failed",
        isProcessing: false,
        step: "confirm",
      });
    }
  }, [
    privacyWallet,
    walletClient,
    publicClient,
    state.selectedToken,
    state.selectedNotes,
    state.receiver,
    parseAmount,
    updateState,
    refreshBalance,
  ]);

  const handleReset = useCallback(() => {
    setState({
      step: "select",
      selectedNotes: [],
      withdrawAmount: "",
      receiver: address ?? "",
      selectedToken: tokens[0] ?? null,
      txHash: null,
      error: null,
      isProcessing: false,
    });
  }, [address, tokens]);

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
            Please connect your wallet to withdraw from the shielded pool.
          </p>
        </div>
      </div>
    );
  }

  if (unspentNotes.length === 0) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
          <Shield className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">
            No Shielded Assets
          </h2>
          <p className="text-zinc-500 text-sm mb-4">
            You don&apos;t have any shielded assets to withdraw. Make a deposit
            first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">UNSHIELD WITHDRAW</h1>
        <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs rounded border border-orange-500/30 flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3" />
          TO PUBLIC
        </span>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {["select", "amount", "confirm", "success"].map((step, index, arr) => {
          const isLastStep = index === arr.length - 1;
          const isSuccess = state.step === "success" && step === "success";
          const isCompleted =
            ["amount", "confirm", "generating", "success"].indexOf(state.step) >
            ["amount", "confirm", "generating", "success"].indexOf(
              step as WithdrawStep
            );
          const isCurrent =
            state.step === step ||
            (step === "confirm" && state.step === "generating");

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
                    ["amount", "confirm", "generating", "success"].indexOf(
                      state.step
                    ) > index
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
        {/* Step: Select Notes */}
        {state.step === "select" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <label className="text-zinc-500 text-sm">
                SELECT NOTES TO SPEND
              </label>
              <button
                onClick={selectAllNotes}
                className="text-purple-400 text-xs hover:text-purple-300"
              >
                Select All
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
              {unspentNotes.map((note) => {
                const isSelected = state.selectedNotes.some(
                  (n) => n.commitment === note.commitment
                );
                return (
                  <button
                    key={note.commitment}
                    onClick={() => toggleNoteSelection(note)}
                    className={`w-full p-4 rounded-lg border transition-all text-left ${
                      isSelected
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-purple-500 bg-purple-500"
                              : "border-zinc-600"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            Note #{note.leafIndex}
                          </p>
                          <p className="text-zinc-500 text-xs">
                            {note.commitment.slice(0, 10)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">
                          {formatAmount(
                            note.amount,
                            state.selectedToken?.decimals ?? 18
                          )}
                        </p>
                        <p className="text-zinc-500 text-xs">
                          {state.selectedToken?.symbol ?? "tokens"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {state.selectedNotes.length > 0 && (
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Selected Total</span>
                  <span className="text-white font-medium">
                    {formatAmount(
                      selectedTotal,
                      state.selectedToken?.decimals ?? 18
                    )}{" "}
                    {state.selectedToken?.symbol ?? "tokens"}
                  </span>
                </div>
              </div>
            )}

            {state.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{state.error}</span>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleContinueToAmount}
              disabled={state.selectedNotes.length === 0}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-xl text-white font-medium transition-all"
            >
              CONTINUE
            </motion.button>
          </>
        )}

        {/* Step: Amount */}
        {state.step === "amount" && (
          <>
            <div className="mb-6">
              <label className="block text-zinc-500 text-sm mb-2">
                WITHDRAW AMOUNT
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={state.withdrawAmount}
                  onChange={(e) =>
                    updateState({ withdrawAmount: e.target.value, error: null })
                  }
                  placeholder="0.00"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-4 py-4 pr-24 text-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateState({
                        withdrawAmount: formatAmount(
                          selectedTotal,
                          state.selectedToken?.decimals ?? 18
                        ),
                      })
                    }
                    className="text-purple-400 text-xs hover:text-purple-300"
                  >
                    MAX
                  </button>
                </div>
              </div>
              <p className="text-zinc-600 text-xs mt-2">
                Available:{" "}
                {formatAmount(
                  selectedTotal,
                  state.selectedToken?.decimals ?? 18
                )}{" "}
                {state.selectedToken?.symbol ?? "tokens"}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-zinc-500 text-sm mb-2">
                RECEIVER ADDRESS
              </label>
              <input
                type="text"
                value={state.receiver}
                onChange={(e) =>
                  updateState({ receiver: e.target.value, error: null })
                }
                placeholder="0x..."
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {state.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{state.error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => updateState({ step: "select" })}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-white font-medium transition-all"
              >
                BACK
              </button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleContinueToConfirm}
                className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium transition-all"
              >
                CONTINUE
              </motion.button>
            </div>
          </>
        )}

        {/* Step: Confirm / Generating */}
        {(state.step === "confirm" || state.step === "generating") && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {state.isProcessing ? (
                  <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                ) : (
                  <ArrowUpRight className="w-8 h-8 text-orange-400" />
                )}
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                {state.isProcessing
                  ? "Generating ZK Proof..."
                  : "Confirm Withdrawal"}
              </h2>
              <p className="text-zinc-500 text-sm">
                {state.isProcessing
                  ? "Please wait while the proof is generated"
                  : "Your tokens will be unshielded to the public address"}
              </p>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Amount</span>
                <span className="text-white">
                  {state.withdrawAmount} tokens
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Notes Spent</span>
                <span className="text-white">{state.selectedNotes.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Receiver</span>
                <span className="text-white font-mono text-xs">
                  {state.receiver.slice(0, 10)}...{state.receiver.slice(-8)}
                </span>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <p className="text-orange-400 text-sm font-medium mb-1">
                    ZK Proof Required
                  </p>
                  <p className="text-zinc-500 text-xs">
                    Withdrawal requires generating a zero-knowledge proof via
                    the SP1 prover service. This proves you own the notes
                    without revealing any private information.
                  </p>
                </div>
              </div>
            </div>

            {state.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{state.error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => updateState({ step: "amount", error: null })}
                disabled={state.isProcessing}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 border border-zinc-700 rounded-xl text-white font-medium transition-all"
              >
                BACK
              </button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleWithdraw}
                disabled={state.isProcessing}
                className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                {state.isProcessing && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {state.isProcessing ? "GENERATING..." : "WITHDRAW"}
              </motion.button>
            </div>
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
                Withdrawal Successful!
              </h2>
              <p className="text-zinc-500 text-sm">
                Your tokens have been unshielded.
              </p>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Amount Withdrawn</span>
                <span className="text-green-400">
                  {state.withdrawAmount} tokens
                </span>
              </div>
              {state.txHash && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-zinc-500">Transaction</span>
                  <a
                    href={`https://sepolia.mantlescan.xyz/tx/${state.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    View
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleReset}
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-white font-medium transition-all"
            >
              MAKE ANOTHER WITHDRAWAL
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}
