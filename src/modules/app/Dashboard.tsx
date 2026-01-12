"use client";

import { useApp } from "@/src/contexts/AppContext";
import { useAccount, useBalance } from "wagmi";
import { useEffect, useMemo } from "react";
import * as motion from "motion/react-client";
import {
  Check,
  Loader2,
  Circle,
  Shield,
  RefreshCw,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { formatUnits, type Address } from "viem";
import { SUPPORTED_TOKENS, DEFAULT_CHAIN_ID } from "@/src/lib/constants";
import { useTreasuryRates } from "@/src/hooks/useTreasuryRates";

function WalletGenerationStepper() {
  const {
    walletGenerationSteps,
    privacyWalletGenerated,
    resetWalletGeneration,
    startWalletGeneration,
    isGeneratingWallet,
  } = useApp();

  const hasError = walletGenerationSteps.some(
    (step) => step.status === "error"
  );

  const handleRetry = () => {
    resetWalletGeneration();
    // Small delay to let state reset
    setTimeout(() => {
      startWalletGeneration();
    }, 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-6">
        Generating Privacy Wallet
      </h3>
      <div className="space-y-4">
        {walletGenerationSteps.map((step) => (
          <div key={step.id} className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              {step.status === "complete" ? (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              ) : step.status === "loading" ? (
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
              ) : step.status === "error" ? (
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-6 h-6 border-2 border-zinc-700 rounded-full flex items-center justify-center">
                  <Circle className="w-3 h-3 text-zinc-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p
                className={`font-medium ${
                  step.status === "complete"
                    ? "text-green-400"
                    : step.status === "loading"
                    ? "text-white"
                    : step.status === "error"
                    ? "text-red-400"
                    : "text-zinc-500"
                }`}
              >
                {step.title}
              </p>
              <p
                className={`text-sm mt-0.5 ${
                  step.status === "error" ? "text-red-400/70" : "text-zinc-500"
                }`}
              >
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      {privacyWalletGenerated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
        >
          <p className="text-green-400 text-sm font-medium">
            ✓ Privacy wallet generated successfully
          </p>
        </motion.div>
      )}
      {hasError && !isGeneratingWallet && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6"
        >
          <button
            onClick={handleRetry}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-colors"
          >
            Retry Generation
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const { isConnected, address, chainId } = useAccount();
  const { data: balance } = useBalance({ address });
  const {
    isGeneratingWallet,
    privacyWalletGenerated,
    startWalletGeneration,
    shieldedBalance,
    balanceByToken,
    unspentNotes,
    isLoadingBalance,
    refreshBalance,
    isSyncing,
    syncWithChain,
    setActiveTab,
  } = useApp();

  // Treasury rates from DeFiLlama
  const treasuryRates = useTreasuryRates();

  // Get token info
  const tokens = SUPPORTED_TOKENS[chainId ?? DEFAULT_CHAIN_ID] ?? [];

  // Convert balanceByToken to holdings format
  const holdings = useMemo(() => {
    const result: Array<{
      id: number;
      instrument: string;
      description: string;
      type: string;
      typeColor: string;
      yieldApy: number;
      position: number;
      valueUsd: number;
      allocPercent: number;
    }> = [];

    let totalValue = 0;
    const entries = Array.from(balanceByToken.entries());

    entries.forEach(([tokenAddress, balance]) => {
      const token = tokens.find(
        (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
      );
      if (token) {
        const amount = Number(formatUnits(balance, token.decimals));
        totalValue += amount; // Assuming 1:1 for stablecoins
      }
    });

    entries.forEach(([tokenAddress, balance], index) => {
      const token = tokens.find(
        (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
      );
      if (token) {
        const amount = Number(formatUnits(balance, token.decimals));
        result.push({
          id: index + 1,
          instrument: token.symbol,
          description: token.name,
          type: token.symbol === "USDC" ? "CASH EQ." : "SHIELDED",
          typeColor: token.symbol === "USDC" ? "bg-green-600" : "bg-purple-600",
          yieldApy: 0,
          position: amount,
          valueUsd: amount, // 1:1 for stablecoins
          allocPercent: totalValue > 0 ? (amount / totalValue) * 100 : 0,
        });
      }
    });

    // If no shielded holdings, show placeholder with formatted balance
    if (result.length === 0 && shieldedBalance > 0n) {
      // Use first token's decimals as default, or 18 if no tokens
      const defaultDecimals = tokens[0]?.decimals ?? 18;
      const formattedBalance = Number(
        formatUnits(shieldedBalance, defaultDecimals)
      );
      result.push({
        id: 1,
        instrument: tokens[0]?.symbol ?? "SHIELDED",
        description: tokens[0]?.name ?? "Private Assets",
        type: "SHIELDED",
        typeColor: "bg-purple-600",
        yieldApy: 0,
        position: formattedBalance,
        valueUsd: formattedBalance,
        allocPercent: 100,
      });
    }

    return result;
  }, [balanceByToken, tokens, shieldedBalance]);

  // Calculate total NAV from holdings
  const totalNav = holdings.reduce((sum, h) => sum + h.valueUsd, 0);

  // Build execution log from notes
  const executionLog = useMemo(() => {
    return unspentNotes.slice(0, 5).map((note, index) => {
      // Find the token for this note to get proper decimals
      const token = tokens.find(
        (t) => t.address.toLowerCase() === note.token.toLowerCase()
      );
      const decimals = token?.decimals ?? 18;
      const symbol = token?.symbol ?? "tokens";

      return {
        id: index + 1,
        type: "DEPOSIT" as const,
        title: "Shielded Deposit",
        counterparty: "Self",
        amount: `+${formatUnits(note.amount, decimals)} ${symbol}`,
        timestamp: new Date(
          Number(note.blockNumber) * 1000
        ).toLocaleTimeString(),
      };
    });
  }, [unspentNotes, tokens]);

  // Start wallet generation when connected
  useEffect(() => {
    if (isConnected && !privacyWalletGenerated && !isGeneratingWallet) {
      startWalletGeneration();
    }
  }, [
    isConnected,
    privacyWalletGenerated,
    isGeneratingWallet,
    startWalletGeneration,
  ]);

  // Show wallet generation stepper if generating
  if (isConnected && (isGeneratingWallet || !privacyWalletGenerated)) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <WalletGenerationStepper />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Top Row - 3 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* NET ASSET VALUE Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between text-zinc-400 text-sm mb-2">
            <span>SHIELDED BALANCE</span>
            <button
              onClick={() => refreshBalance()}
              disabled={isLoadingBalance || isSyncing}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  isLoadingBalance || isSyncing ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold text-white">
              {totalNav > 0
                ? `$${totalNav.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}`
                : "$0.00"}
            </span>
            {totalNav > 0 && (
              <span className="text-green-400 text-sm">SHIELDED</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-zinc-500">NOTES</p>
              <p className="text-white">{unspentNotes.length}</p>
            </div>
            <div>
              <p className="text-zinc-500">STATUS</p>
              <p className="text-green-400">● Active</p>
            </div>
            <div>
              <p className="text-zinc-500">PRIVACY</p>
              <p className="text-purple-400">● Full</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800">
            <button
              onClick={() => setActiveTab("deposit")}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <ArrowDownRight className="w-3 h-3" />
              Deposit
            </button>
            <button
              onClick={() => setActiveTab("withdraw")}
              className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <ArrowUpRight className="w-3 h-3" />
              Withdraw
            </button>
          </div>
        </motion.div>

        {/* COMPLIANCE & AUDIT Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-zinc-400" />
              <span className="text-zinc-400 text-sm">PRIVACY STATUS</span>
            </div>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
              ACTIVE
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Wallet Type</span>
              <span className="text-white">STEALTH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Commitments</span>
              <span className="text-purple-400">
                {unspentNotes.length} UTXO
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">ZK Proofs</span>
              <span className="text-cyan-400">SP1 ENABLED</span>
            </div>
          </div>
          <button
            onClick={() => syncWithChain()}
            disabled={isSyncing}
            className="w-full mt-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 text-sm hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
          >
            {isSyncing && <Loader2 className="w-3 h-3 animate-spin" />}
            {isSyncing ? "SYNCING..." : "SYNC WITH CHAIN"}
          </button>
        </motion.div>

        {/* TREASURY REF RATES Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-4">
            <span>TREASURY REF RATES</span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">USTB Yield</span>
              <span className="text-cyan-400">{treasuryRates.ustbYield}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">USDC Lend</span>
              <span className="text-cyan-400">{treasuryRates.usdcLend}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Private Credit</span>
              <span className="text-cyan-400">
                {treasuryRates.privateCredit}%
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-600 mt-4">
            Updated: {treasuryRates.lastUpdated}
          </p>
        </motion.div>
      </div>

      {/* Bottom Row - Holdings Table & Execution Log */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Holdings Allocation Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">SHIELDED HOLDINGS</h3>
            <button
              onClick={() => setActiveTab("deposit")}
              className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
            >
              + Add Funds
            </button>
          </div>

          {holdings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 text-left border-b border-zinc-800">
                    <th className="pb-3 font-medium">ASSET</th>
                    <th className="pb-3 font-medium">TYPE</th>
                    <th className="pb-3 font-medium text-right">AMOUNT</th>
                    <th className="pb-3 font-medium text-right">VALUE (USD)</th>
                    <th className="pb-3 font-medium text-right">ALLOC %</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => (
                    <tr
                      key={holding.id}
                      className="border-b border-zinc-800/50"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-white">
                            {holding.instrument.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {holding.instrument}
                            </p>
                            <p className="text-zinc-500 text-xs">
                              {holding.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-1 ${holding.typeColor} text-white text-xs rounded`}
                        >
                          {holding.type}
                        </span>
                      </td>
                      <td className="py-4 text-right text-white">
                        {holding.position.toLocaleString()}
                      </td>
                      <td className="py-4 text-right text-cyan-400">
                        $
                        {holding.valueUsd.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-4 text-right text-white">
                        {holding.allocPercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 mb-4">No shielded assets yet</p>
              <button
                onClick={() => setActiveTab("deposit")}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
              >
                Make Your First Deposit
              </button>
            </div>
          )}
        </motion.div>

        {/* Execution Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">RECENT ACTIVITY</h3>
            <span className="text-zinc-600 text-xs">...</span>
          </div>

          {executionLog.length > 0 ? (
            <div className="space-y-4">
              {executionLog.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between pb-4 border-b border-zinc-800/50 last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          log.type === "DEPOSIT"
                            ? "bg-green-500/20 text-green-400"
                            : log.type === "TRANSFER"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-purple-500/20 text-purple-400"
                        }`}
                      >
                        {log.type}
                      </span>
                      <span className="text-zinc-600 text-xs">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="text-white text-sm">{log.title}</p>
                    <p className="text-zinc-500 text-xs">{log.counterparty}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm ${
                        log.amount.startsWith("+")
                          ? "text-green-400"
                          : log.amount.startsWith("-")
                          ? "text-red-400"
                          : "text-white"
                      }`}
                    >
                      {log.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-zinc-500 text-sm">No recent activity</p>
            </div>
          )}

          <button className="w-full mt-4 py-2 text-zinc-500 text-sm hover:text-zinc-400 transition-colors">
            VIEW FULL HISTORY
          </button>
        </motion.div>
      </div>
    </div>
  );
}
