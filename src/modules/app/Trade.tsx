"use client";

import { useState, useCallback, useMemo } from "react";
import { useAccount, usePublicClient, useWalletClient, useSwitchChain } from "wagmi";
import { formatUnits } from "viem";
import {
  SUPPORTED_TOKENS,
  DEFAULT_CHAIN_ID,
  type TokenInfo,
} from "@/src/lib/constants";
import { ContractService } from "@/src/wallet-sdk/contractService";
import { useEffect } from "react";
import * as motion from "motion/react-client";
import {
  Lock,
  ArrowLeftRight,
  Check,
  Loader2,
  Shield,
  Zap,
} from "lucide-react";

import { useApp } from "@/src/contexts/AppContext";
import { getErrorMessage } from "@/src/lib/errorHandling";

type OrderType = "market" | "limit" | "twap";
type TransactionStep =
  | "idle"
  | "executing"
  | "signing"
  | "zk-proof"
  | "done"
  | "failed";

interface ZKProofData {
  commitment: string;
  nullifier: string;
  witness: string;
  proof: string;
  publicInputs: string[];
}

export default function Trade() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { privacyWallet, refreshBalance } = useApp();

  () => SUPPORTED_TOKENS[DEFAULT_CHAIN_ID] ?? [],
    []
  );

  const { switchChain } = useSwitchChain();
  const isWrongNetwork = chainId !== DEFAULT_CHAIN_ID;

  const [sellToken, setSellToken] = useState<TokenInfo>(
    supportedTokens[0] || {
      address: "0x" as `0x${string}`,
      symbol: "ETH",
      name: "Ether",
      decimals: 18,
    }
  );

  const [buyToken, setBuyToken] = useState<TokenInfo>(
    supportedTokens[1] || {
      address: "0x" as `0x${string}`,
      symbol: "USDC",
      name: "Teleport USDC",
      decimals: 6,
    }
  );

  const [sellAmount, setSellAmount] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("market");

  // Real token balances
  const [balances, setBalances] = useState<Record<string, number>>({});

  // Fetch balances
  useEffect(() => {
    if (!address || !publicClient) return;

    const fetchBalances = async () => {
      const newBalances: Record<string, number> = {};
      const contractService = new ContractService(publicClient);

      for (const token of supportedTokens) {
        try {
          const balance = await contractService.getTokenBalance(
            token.address,
            address
          );
          newBalances[token.address] = parseFloat(
            formatUnits(balance, token.decimals)
          );
        } catch (e) {
          console.error(`Failed to fetch balance for ${token.symbol}:`, e);
          newBalances[token.address] = 0;
        }
      }
      setBalances(newBalances);
    };

    fetchBalances();
    // Poll every 10s
    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [address, publicClient, supportedTokens]);

  // Transaction state
  const [transactionStep, setTransactionStep] =
    useState<TransactionStep>("idle");
  const [zkProofData, setZkProofData] = useState<ZKProofData | null>(null);
  const [zkProofProgress, setZkProofProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate buy amount based on sell amount (derived state using useMemo)
  const buyAmount = useMemo(() => {
    if (sellAmount && !isNaN(parseFloat(sellAmount))) {
      const sellValue = parseFloat(sellAmount);
      // Hardcoded mock rate for now until we have a real oracle/AMM
      const calculateRate = (from: string, to: string) => {
        if (from === "mUSDT" && to === "SepMNT") return 0.5; // 1 mUSDT = 0.5 SepMNT
        if (from === "SepMNT" && to === "mUSDT") return 2.0; // 1 SepMNT = 2.0 mUSDT
        return 1.0;
      };

      const rate = calculateRate(sellToken.symbol, buyToken.symbol);
      const calculatedBuy = sellValue * rate;

      return calculatedBuy.toFixed(6).replace(/\.?0+$/, "");
    }
    return "";
  }, [sellAmount, sellToken.symbol, buyToken.symbol]);

  const handleSwapTokens = () => {
    const temp = sellToken;
    setSellToken(buyToken);
    setBuyToken(temp);
    setSellAmount("");
  };

  const handleSellAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setSellAmount(value);
    }
  };

  // Generate mock ZK proof data
  const generateMockZKProof = useCallback((): ZKProofData => {
    const randomHex = (length: number) =>
      Array.from({ length }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");

    return {
      commitment: `0x${randomHex(64)}`,
      nullifier: `0x${randomHex(64)}`,
      witness: `0x${randomHex(128)}`,
      proof: `0x${randomHex(256)}`,
      publicInputs: [
        `0x${randomHex(64)}`,
        `0x${randomHex(64)}`,
        `0x${randomHex(64)}`,
      ],
    };
  }, []);

  // Execute transaction with step-by-step progress
  const handleExecute = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) return;

    const sellValue = parseFloat(sellAmount);
    const currentBalance = balances[sellToken.address] || 0;

    // Validate balance
    if (sellValue > currentBalance) {
      setErrorMessage(
        `Insufficient balance. You only have ${currentBalance} ${sellToken.symbol}`
      );

      setTransactionStep("failed");
      return;
    }

    setErrorMessage(null);

    // Step 1: Executing Transaction
    setTransactionStep("executing");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Step 2: Sign Transaction
    setTransactionStep("signing");
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Step 3: Create ZK Proof (with progress simulation)
    setTransactionStep("zk-proof");
    setZkProofProgress(0);

    try {
      // Simulate ZK proof generation with progress
      for (let i = 0; i <= 100; i += Math.floor(Math.random() * 15) + 5) {
        setZkProofProgress(Math.min(i, 100));
        await new Promise((resolve) =>
          setTimeout(resolve, 50 + Math.random() * 100)
        );
      }
      setZkProofProgress(100);

      // Generate mock proof using library (for correct format)
      // Dynamically import to avoid server-side issues
      const { createMockSwapProof } = await import(
        "@/src/wallet-sdk/mockProofs"
      );
      const proof = createMockSwapProof(); // Generates valid mock proof structure

      // Display proof data for UI
      setZkProofData({
        commitment: "0x...", // Simplified for display
        nullifier: "0x...",
        witness: "0x...",
        proof: proof.proofBytes,
        publicInputs: [proof.publicInputs],
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 4: Execute on Blockchain
      if (privacyWallet) {
        const { txHash } = await privacyWallet.executeSwap(
          proof.publicInputs,
          proof.proofBytes
        );
        // Wait for transaction
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await refreshBalance();
      }

      // Update local balances (optimistic)
      const buyValue = parseFloat(buyAmount);
      setBalances((prev) => ({
        ...prev,
        [sellToken.address]: prev[sellToken.address] - sellValue,
        [buyToken.address]: prev[buyToken.address] + buyValue,
      }));

      setTransactionStep("done");
    } catch (error) {
      console.error("Trade failed:", error);
      setErrorMessage(getErrorMessage(error));
      setTransactionStep("failed");
    }
  };

  const resetTransaction = () => {
    setTransactionStep("idle");
    setZkProofData(null);
    setZkProofProgress(0);
    setSellAmount("");
    setErrorMessage(null);
  };

  const getStepStatus = (step: TransactionStep) => {
    const steps: TransactionStep[] = [
      "executing",
      "signing",
      "zk-proof",
      "done",
    ];
    const currentIndex = steps.indexOf(transactionStep);
    const stepIndex = steps.indexOf(step);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  const sellValue = sellAmount ? parseFloat(sellAmount) : 0;
  const isInsufficientBalance = sellValue > (balances[sellToken.address] || 0);
  const isExecuteDisabled =
    !sellAmount || sellValue <= 0 || transactionStep !== "idle";

  !sellAmount || sellValue <= 0 || transactionStep !== "idle";

  if (isWrongNetwork) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">
            Wrong Network
          </h2>
          <p className="text-zinc-500 text-sm mb-6">
            Please connect to Mantle Sepolia Testnet to use this feature.
          </p>
          <button
            onClick={() => switchChain({ chainId: DEFAULT_CHAIN_ID })}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
          >
            Switch to Mantle Sepolia
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-zinc-400" />
          <h1 className="text-xl font-bold text-white">PRIVATE TRADE</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded border border-cyan-500/30">
            SP1 ENCLAVE: ACTIVE
          </span>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30">
            MEV PROTECTION: ON
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Trade Form - Left Side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3"
        >
          {/* Swap Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="grid grid-cols-2 gap-4 relative">
              {/* Sell Section */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-zinc-500 text-sm">
                    SELL (SOURCE ASSET)
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-lg font-bold text-white`}
                  >
                    {sellToken.icon || sellToken.symbol[0]}
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {sellToken.symbol}
                    </p>
                    <p className="text-zinc-500 text-xs">
                      Balance:{" "}
                      {(balances[sellToken.address] || 0n).toLocaleString()}
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  value={sellAmount}
                  onChange={(e) => handleSellAmountChange(e.target.value)}
                  placeholder="0.00"
                  disabled={transactionStep !== "idle"}
                  className={`w-full bg-transparent text-2xl text-white placeholder-zinc-600 outline-none disabled:opacity-50 ${isInsufficientBalance ? "text-red-400" : ""
                    }`}
                />
                {isInsufficientBalance && transactionStep === "idle" && (
                  <p className="mt-1 text-xs text-red-400">
                    Insufficient balance
                  </p>
                )}
                <button
                  onClick={() =>
                    setSellAmount((balances[sellToken.address] || 0).toString())
                  }
                  disabled={transactionStep !== "idle"}
                  className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                >
                  MAX
                </button>
              </div>

              {/* Swap Button */}
              <motion.button
                onClick={handleSwapTokens}
                disabled={transactionStep !== "idle"}
                whileHover={{
                  scale: transactionStep === "idle" ? 1.1 : 1,
                  rotate: transactionStep === "idle" ? 180 : 0,
                }}
                whileTap={{ scale: 0.9 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                <ArrowLeftRight className="w-4 h-4 text-zinc-400" />
              </motion.button>

              {/* Buy Section */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-zinc-500 text-sm">
                    BUY (TARGET ASSET)
                  </span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-lg font-bold text-white`}
                    >
                      {buyToken.icon || buyToken.symbol[0]}
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {buyToken.symbol}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        Balance:{" "}
                        {(balances[buyToken.address] || 0n).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-2xl text-white">{buyAmount || "0.00"}</div>
                <p className="mt-2 text-xs text-zinc-500">
                  Rate: 1 {sellToken.symbol} ={" "}
                  {sellToken.symbol === "mUSDT" ? "0.5" : "2.0"}{" "}
                  {buyToken.symbol}
                </p>
              </div>
            </div>

            {/* Order Type Selection */}
            <div className="flex items-center gap-4 mt-6">
              {[
                { id: "market" as OrderType, label: "Market (Dark)" },
                { id: "limit" as OrderType, label: "Limit (Shielded)" },
                { id: "twap" as OrderType, label: "TWAP" },
              ].map((type) => (
                <label
                  key={type.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="orderType"
                    checked={orderType === type.id}
                    onChange={() => setOrderType(type.id)}
                    disabled={transactionStep !== "idle"}
                    className="w-4 h-4 text-cyan-500 bg-zinc-800 border-zinc-600 focus:ring-cyan-500 focus:ring-offset-zinc-900 disabled:opacity-50"
                  />
                  <span
                    className={`text-sm ${orderType === type.id ? "text-white" : "text-zinc-500"
                      }`}
                  >
                    {type.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Execute Button */}
            {transactionStep === "idle" ? (
              <motion.button
                onClick={handleExecute}
                disabled={isExecuteDisabled || isInsufficientBalance}
                whileHover={{
                  scale: isExecuteDisabled || isInsufficientBalance ? 1 : 1.01,
                }}
                whileTap={{ scale: 0.99 }}
                className={`w-full mt-6 py-4 rounded-xl font-medium transition-all ${isExecuteDisabled || isInsufficientBalance
                  ? "bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500"
                  }`}
              >
                {isInsufficientBalance
                  ? "INSUFFICIENT BALANCE"
                  : sellAmount && parseFloat(sellAmount) > 0
                    ? "EXECUTE TRADE"
                    : "ENTER VOLUME"}
              </motion.button>
            ) : transactionStep === "done" ? (
              <motion.button
                onClick={resetTransaction}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full mt-6 py-4 bg-green-600 rounded-xl text-white font-medium hover:bg-green-500 transition-all"
              >
                ✓ TRADE COMPLETE - NEW TRADE
              </motion.button>
            ) : transactionStep === "failed" ? (
              <div className="mt-6">
                <div className="w-full py-4 bg-red-900/50 border border-red-500/50 rounded-xl text-red-400 font-medium text-center mb-2">
                  ✗ TRADE FAILED
                </div>
                {errorMessage && (
                  <p className="text-xs text-red-400 text-center mb-2">
                    {errorMessage}
                  </p>
                )}
                <motion.button
                  onClick={resetTransaction}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 font-medium hover:bg-zinc-700 transition-all"
                >
                  TRY AGAIN
                </motion.button>
              </div>
            ) : (
              <div className="w-full mt-6 py-4 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 font-medium text-center">
                PROCESSING...
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Side - Transaction Progress & Settlement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-4"
        >
          {/* Transaction Progress */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-zinc-400 text-sm mb-4">TRANSACTION PROGRESS</h3>

            <div className="space-y-4">
              {/* Step 1: Executing Transaction */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepStatus("executing") === "completed"
                    ? "bg-green-500"
                    : getStepStatus("executing") === "active"
                      ? "bg-cyan-500 animate-pulse"
                      : "bg-zinc-700"
                    }`}
                >
                  {getStepStatus("executing") === "completed" ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : getStepStatus("executing") === "active" ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <span className="text-xs text-zinc-400">1</span>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm ${getStepStatus("executing") === "active"
                      ? "text-cyan-400"
                      : getStepStatus("executing") === "completed"
                        ? "text-green-400"
                        : "text-zinc-500"
                      }`}
                  >
                    Executing Transaction
                  </p>
                </div>
              </div>

              {/* Step 2: Sign Transaction */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepStatus("signing") === "completed"
                    ? "bg-green-500"
                    : getStepStatus("signing") === "active"
                      ? "bg-cyan-500 animate-pulse"
                      : "bg-zinc-700"
                    }`}
                >
                  {getStepStatus("signing") === "completed" ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : getStepStatus("signing") === "active" ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <span className="text-xs text-zinc-400">2</span>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm ${getStepStatus("signing") === "active"
                      ? "text-cyan-400"
                      : getStepStatus("signing") === "completed"
                        ? "text-green-400"
                        : "text-zinc-500"
                      }`}
                  >
                    Sign Transaction
                  </p>
                </div>
              </div>

              {/* Step 3: Create ZK Proof */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getStepStatus("zk-proof") === "completed"
                    ? "bg-green-500"
                    : getStepStatus("zk-proof") === "active"
                      ? "bg-cyan-500 animate-pulse"
                      : "bg-zinc-700"
                    }`}
                >
                  {getStepStatus("zk-proof") === "completed" ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : getStepStatus("zk-proof") === "active" ? (
                    <Shield className="w-4 h-4 text-white animate-pulse" />
                  ) : (
                    <span className="text-xs text-zinc-400">3</span>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm ${getStepStatus("zk-proof") === "active"
                      ? "text-cyan-400"
                      : getStepStatus("zk-proof") === "completed"
                        ? "text-green-400"
                        : "text-zinc-500"
                      }`}
                  >
                    Create ZK Proof
                  </p>
                  {getStepStatus("zk-proof") === "active" && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                        <span>Generating proof...</span>
                        <span>{zkProofProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${zkProofProgress}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4: Done */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepStatus("done") === "completed" ||
                    transactionStep === "done"
                    ? "bg-green-500"
                    : "bg-zinc-700"
                    }`}
                >
                  {transactionStep === "done" ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-xs text-zinc-400">4</span>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm ${transactionStep === "done"
                      ? "text-green-400"
                      : "text-zinc-500"
                      }`}
                  >
                    Done
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ZK Proof Data (shown when generated) */}
          {zkProofData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-zinc-400 text-sm">ZK PROOF DATA</h3>
              </div>
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <p className="text-zinc-500 mb-1">Commitment:</p>
                  <p className="text-cyan-400 break-all">
                    {zkProofData.commitment.slice(0, 42)}...
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">Nullifier:</p>
                  <p className="text-purple-400 break-all">
                    {zkProofData.nullifier.slice(0, 42)}...
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">Proof:</p>
                  <p className="text-green-400 break-all">
                    {zkProofData.proof.slice(0, 42)}...
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-green-400">
                <Zap className="w-3 h-3" />
                <span>Proof verified on SP1 Enclave</span>
              </div>
            </motion.div>
          )}

          {/* Settlement Info */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-zinc-400 text-sm mb-4">SETTLEMENT</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Method</span>
                <span className="text-white">Atomic Swap</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Venue</span>
                <span className="text-cyan-400">Gelap SP-1 Enclave</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Fees</span>
                <span className="text-cyan-400">0.05% (Institutional)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Exchange Rate</span>
                <span className="text-white">1 {sellToken.symbol} = {sellToken.symbol === "mUSDT" ? "0.5" : "2.0"} {buyToken.symbol}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
