"use client";

import { useApp } from "@/src/contexts/AppContext";
import { useAccount, useBalance } from "wagmi";
import { useEffect } from "react";
import * as motion from "motion/react-client";
import { 
  Check, 
  Loader2, 
  Circle, 
  Shield, 
  FileCheck, 
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react";

// Mock data for treasury rates (would come from Chronicle/Chainlink in production)
const treasuryRates = {
  ustbYield: 5.28,
  usdcLend: 4.85,
  privateCredit: 11.5,
  lastUpdated: "14:30 EST",
};

// Mock holdings data
const holdings = [
  {
    id: 1,
    instrument: "USTB",
    description: "US T-Bill Fund",
    type: "FIXED INCOME",
    typeColor: "bg-blue-600",
    yieldApy: 5.2,
    position: 12287.52,
    valueUsd: 12500.5,
    allocPercent: 27.7,
  },
  {
    id: 2,
    instrument: "USDC",
    description: "USDC Treasury",
    type: "CASH EQ.",
    typeColor: "bg-green-600",
    yieldApy: 0.0,
    position: 45000,
    valueUsd: 45000.0,
    allocPercent: 62.3,
  },
  {
    id: 3,
    instrument: "PCF1",
    description: "PC Fund",
    type: "PRIVATE CREDIT",
    typeColor: "bg-purple-600",
    yieldApy: 11.5,
    position: 470.19,
    valueUsd: 5000.0,
    allocPercent: 10.0,
  },
];

// Mock execution log
const executionLog = [
  {
    id: 1,
    type: "EXECUTION",
    title: "Buy USTB via Dark Pool",
    counterparty: "Confidential",
    amount: "5,000.00 USDC",
    timestamp: "13:00:05",
  },
  {
    id: 2,
    type: "DEPOSIT",
    title: "Shielded Ingress",
    counterparty: "Coinbase Inst.",
    amount: "+10,000.00 USDC",
    timestamp: "12:01:52",
  },
  {
    id: 3,
    type: "TRANSFER",
    title: "Internal Allocation",
    counterparty: "Sub-fund A",
    amount: "-2,500.00 USTB",
    timestamp: "09:12:08",
  },
];

function WalletGenerationStepper() {
  const { walletGenerationSteps, isGeneratingWallet, privacyWalletGenerated } = useApp();

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
        {walletGenerationSteps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              {step.status === "complete" ? (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              ) : step.status === "loading" ? (
                <div className="w-6 h-6 bg-stormy_teal-600 rounded-full flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
              ) : (
                <div className="w-6 h-6 border-2 border-zinc-700 rounded-full flex items-center justify-center">
                  <Circle className="w-3 h-3 text-zinc-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${
                step.status === "complete" 
                  ? "text-green-400" 
                  : step.status === "loading"
                  ? "text-white"
                  : "text-zinc-500"
              }`}>
                {step.title}
              </p>
              <p className="text-sm text-zinc-500 mt-0.5">{step.description}</p>
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
    </motion.div>
  );
}

export default function Dashboard() {
  const { isConnected, address } = useAccount();
  const { data: balance } = useBalance({ address });
  const { 
    isGeneratingWallet, 
    privacyWalletGenerated, 
    startWalletGeneration 
  } = useApp();

  // Start wallet generation when connected
  useEffect(() => {
    if (isConnected && !privacyWalletGenerated && !isGeneratingWallet) {
      startWalletGeneration();
    }
  }, [isConnected, privacyWalletGenerated, isGeneratingWallet, startWalletGeneration]);

  // Show wallet generation stepper if generating
  if (isConnected && (isGeneratingWallet || !privacyWalletGenerated)) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <WalletGenerationStepper />
      </div>
    );
  }

  // Calculate total NAV from holdings
  const totalNav = holdings.reduce((sum, h) => sum + h.valueUsd, 0);

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
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <span>NET ASSET VALUE (NAV)</span>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold text-white">
              ${totalNav.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-green-400 text-sm">+1.24%</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-zinc-500">YTD RETURN</p>
              <p className="text-white">+8.45%</p>
            </div>
            <div>
              <p className="text-zinc-500">COLLAT. %</p>
              <p className="text-white">100.0%</p>
            </div>
            <div>
              <p className="text-zinc-500">VAULTS QTY</p>
              <p className="text-green-400">● Active</p>
            </div>
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
              <span className="text-zinc-400 text-sm">COMPLIANCE & AUDIT</span>
            </div>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
              PASS
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">KYB Status</span>
              <span className="text-white">VERIFIED (11)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Jurisdiction</span>
              <span className="text-yellow-400">BVI / SG</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Auditor Mode</span>
              <span className="text-zinc-400">OFF</span>
            </div>
          </div>
          <button className="w-full mt-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 text-sm hover:bg-zinc-700 transition-colors">
            GENERATE AUDIT REPORT
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
              <span className="text-cyan-400">{treasuryRates.privateCredit}%</span>
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
            <h3 className="text-white font-semibold">HOLDINGS ALLOCATION</h3>
            <button className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors">
              Rebalance Portfolio
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 text-left border-b border-zinc-800">
                  <th className="pb-3 font-medium">INSTRUMENT</th>
                  <th className="pb-3 font-medium">TYPE</th>
                  <th className="pb-3 font-medium text-right">YIELD (APY)</th>
                  <th className="pb-3 font-medium text-right">POSITION</th>
                  <th className="pb-3 font-medium text-right">VALUE (USD)</th>
                  <th className="pb-3 font-medium text-right">ALLOC %</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding.id} className="border-b border-zinc-800/50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {holding.instrument.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{holding.instrument}</p>
                          <p className="text-zinc-500 text-xs">{holding.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 ${holding.typeColor} text-white text-xs rounded`}>
                        {holding.type}
                      </span>
                    </td>
                    <td className="py-4 text-right text-cyan-400">{holding.yieldApy}%</td>
                    <td className="py-4 text-right text-white">{holding.position.toLocaleString()}</td>
                    <td className="py-4 text-right text-cyan-400">
                      {holding.valueUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 text-right text-white">{holding.allocPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Execution Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">EXECUTION LOG</h3>
            <span className="text-zinc-600 text-xs">...</span>
          </div>
          <div className="space-y-4">
            {executionLog.map((log) => (
              <div key={log.id} className="flex items-start justify-between pb-4 border-b border-zinc-800/50 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      log.type === "EXECUTION" 
                        ? "bg-purple-500/20 text-purple-400"
                        : log.type === "DEPOSIT"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-zinc-600 text-xs">{log.timestamp}</span>
                  </div>
                  <p className="text-white text-sm">{log.title}</p>
                  <p className="text-zinc-500 text-xs">CP: {log.counterparty}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm ${
                    log.amount.startsWith("+") 
                      ? "text-green-400" 
                      : log.amount.startsWith("-")
                      ? "text-red-400"
                      : "text-white"
                  }`}>
                    {log.amount}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-zinc-500 text-sm hover:text-zinc-400 transition-colors">
            VIEW FULL BLOTTER
          </button>
        </motion.div>
      </div>
    </div>
  );
}
