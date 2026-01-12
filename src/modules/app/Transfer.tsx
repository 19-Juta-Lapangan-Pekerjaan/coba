"use client";

import { useState, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import * as motion from "motion/react-client";
import { Shield, Send, Check, Loader2, AlertCircle, Info } from "lucide-react";
import { formatUnits, parseUnits, isAddress } from "viem";

import { useApp } from "@/src/contexts/AppContext";
import { SUPPORTED_TOKENS, DEFAULT_CHAIN_ID } from "@/src/lib/constants";

// ============================================================================
// Types
// ============================================================================

type TransferStep = "input" | "confirm" | "processing" | "success";

interface TransferState {
  step: TransferStep;
  recipientAddress: string;
  amount: string;
  error: string | null;
  isProcessing: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function Transfer() {
  const { isConnected, chainId } = useAccount();
  const { privacyWallet, unspentNotes, refreshBalance } = useApp();

  // Get supported tokens
  const tokens = SUPPORTED_TOKENS[chainId ?? DEFAULT_CHAIN_ID] ?? [];
  const defaultToken = tokens[0];

  // Calculate available balance from unspent notes
  const availableBalance = useMemo(() => {
    return unspentNotes.reduce((sum, note) => sum + note.amount, 0n);
  }, [unspentNotes]);

  // Local state
  const [state, setState] = useState<TransferState>({
    step: "input",
    recipientAddress: "",
    amount: "",
    error: null,
    isProcessing: false,
  });

  // =========================================================================
  // Helpers
  // =========================================================================

  const updateState = useCallback((updates: Partial<TransferState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const parseAmount = useCallback(() => {
    if (!state.amount || !defaultToken) return 0n;
    try {
      return parseUnits(state.amount, defaultToken.decimals);
    } catch {
      return 0n;
    }
  }, [state.amount, defaultToken]);

  const formatAmount = useCallback(
    (amount: bigint) => {
      return formatUnits(amount, defaultToken?.decimals ?? 18);
    },
    [defaultToken]
  );

  // =========================================================================
  // Validation
  // =========================================================================

  const validateInputs = useCallback(() => {
    // Validate recipient address
    if (!state.recipientAddress) {
      updateState({ error: "Please enter a recipient address" });
      return false;
    }

    if (!isAddress(state.recipientAddress)) {
      updateState({ error: "Please enter a valid address" });
      return false;
    }

    // Validate amount
    const amount = parseAmount();
    if (amount === 0n) {
      updateState({ error: "Please enter a valid amount" });
      return false;
    }

    if (amount > availableBalance) {
      updateState({ error: "Amount exceeds available balance" });
      return false;
    }

    return true;
  }, [state.recipientAddress, parseAmount, availableBalance, updateState]);

  // =========================================================================
  // Actions
  // =========================================================================

  const handleContinue = useCallback(() => {
    if (!validateInputs()) return;
    updateState({ step: "confirm", error: null });
  }, [validateInputs, updateState]);

  const handleTransfer = useCallback(async () => {
    if (!privacyWallet) return;

    updateState({ isProcessing: true, step: "processing", error: null });

    try {
      // Simulate transfer processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock: Show that prover is not available
      updateState({
        error:
          "Prover service not available. In production, this would generate a ZK proof for private transfer.",
        isProcessing: false,
        step: "confirm",
      });
    } catch (error) {
      console.error("Transfer failed:", error);
      updateState({
        error: error instanceof Error ? error.message : "Transfer failed",
        isProcessing: false,
        step: "confirm",
      });
    }
  }, [privacyWallet, updateState]);

  const handleReset = useCallback(() => {
    setState({
      step: "input",
      recipientAddress: "",
      amount: "",
      error: null,
      isProcessing: false,
    });
  }, []);

  // =========================================================================
  // Render
  // =========================================================================

  if (!isConnected) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
          <Send className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">
            Connect Wallet
          </h2>
          <p className="text-zinc-500 text-sm">
            Please connect your wallet to make private transfers.
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
            You don't have any shielded assets to transfer. Make a deposit
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
        <h1 className="text-xl font-bold text-white">PRIVATE TRANSFER</h1>
        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded border border-purple-500/30 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          ZK SHIELDED
        </span>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {["input", "confirm", "success"].map((step, index) => (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                state.step === step || state.step === "processing"
                  ? "bg-purple-500 text-white"
                  : ["confirm", "processing", "success"].indexOf(state.step) >
                    ["confirm", "processing", "success"].indexOf(
                      step as TransferStep
                    )
                  ? "bg-green-500 text-white"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {["confirm", "processing", "success"].indexOf(state.step) >
              ["confirm", "processing", "success"].indexOf(
                step as TransferStep
              ) ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < 2 && (
              <div
                className={`flex-1 h-0.5 ${
                  ["confirm", "processing", "success"].indexOf(state.step) >
                  index
                    ? "bg-green-500"
                    : "bg-zinc-800"
                }`}
              />
            )}
          </div>
        ))}
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
            {/* Recipient Address */}
            <div className="mb-6">
              <label className="block text-zinc-500 text-sm mb-2">
                RECIPIENT ADDRESS
              </label>
              <input
                type="text"
                value={state.recipientAddress}
                onChange={(e) =>
                  updateState({ recipientAddress: e.target.value, error: null })
                }
                placeholder="0x..."
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <p className="text-zinc-600 text-xs mt-2">
                Enter the recipient's stealth address or public address
              </p>
            </div>

            {/* Transfer Amount */}
            <div className="mb-6">
              <label className="block text-zinc-500 text-sm mb-2">
                TRANSFER AMOUNT
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
                    onClick={() =>
                      updateState({
                        amount: formatAmount(availableBalance),
                      })
                    }
                    className="text-purple-400 text-xs hover:text-purple-300"
                  >
                    MAX
                  </button>
                  <span className="text-zinc-500">
                    {defaultToken?.symbol ?? "TOKEN"}
                  </span>
                </div>
              </div>
              <p className="text-zinc-600 text-xs mt-2">
                Available: {formatAmount(availableBalance)}{" "}
                {defaultToken?.symbol ?? "tokens"}
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium mb-1">
                    Private Transfer
                  </p>
                  <p className="text-zinc-500 text-xs">
                    This transfer is shielded with zero-knowledge proofs. The
                    amount and recipient are hidden from the public blockchain.
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
              disabled={!state.amount || !state.recipientAddress}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-xl text-white font-medium transition-all"
            >
              CONTINUE
            </motion.button>
          </>
        )}

        {/* Step: Confirm / Processing */}
        {(state.step === "confirm" || state.step === "processing") && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {state.isProcessing ? (
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                ) : (
                  <Send className="w-8 h-8 text-purple-400" />
                )}
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                {state.isProcessing
                  ? "Generating ZK Proof..."
                  : "Confirm Transfer"}
              </h2>
              <p className="text-zinc-500 text-sm">
                {state.isProcessing
                  ? "Please wait while the proof is generated"
                  : "Review the transfer details below"}
              </p>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Amount</span>
                <span className="text-white">
                  {state.amount} {defaultToken?.symbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Recipient</span>
                <span className="text-white font-mono text-xs">
                  {state.recipientAddress.slice(0, 10)}...
                  {state.recipientAddress.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Privacy</span>
                <span className="text-purple-400">ZK Shielded</span>
              </div>
            </div>

            {/* Error */}
            {state.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{state.error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => updateState({ step: "input", error: null })}
                disabled={state.isProcessing}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 border border-zinc-700 rounded-xl text-white font-medium transition-all"
              >
                BACK
              </button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleTransfer}
                disabled={state.isProcessing}
                className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                {state.isProcessing && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {state.isProcessing ? "PROCESSING..." : "TRANSFER"}
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
                Transfer Successful!
              </h2>
              <p className="text-zinc-500 text-sm">
                Your private transfer has been completed.
              </p>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Amount Transferred</span>
                <span className="text-green-400">
                  {state.amount} {defaultToken?.symbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Recipient</span>
                <span className="text-white font-mono text-xs">
                  {state.recipientAddress.slice(0, 10)}...
                  {state.recipientAddress.slice(-8)}
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleReset}
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-white font-medium transition-all"
            >
              MAKE ANOTHER TRANSFER
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}
