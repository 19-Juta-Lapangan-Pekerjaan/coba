"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Check, ShieldCheck } from "lucide-react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "framer-motion";
import { MeshGradient } from "@paper-design/shaders-react";
import { useTransfer } from "@/src/contexts/TransferContext";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import { formatUnits, parseUnits } from "viem";

export function TransferModal() {
  const { isExpanded, closeTransfer } = useTransfer();
  const [activeTab, setActiveTab] = useState<"transfer" | "redeem">("transfer");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Wagmi hooks
  const { address: walletAddress, isConnected } = useAccount();
  const { data: balanceData } = useBalance({
    address: walletAddress,
  });

  const handleClose = () => {
    closeTransfer();
    // Reset form when closing
    setAddress("");
    setAmount("");
    setStatus("idle");
  };

  const handleSend = async () => {
    if (!address || !amount) return;

    setStatus("loading");

    // Mock "Hidden Layer" processing
    setTimeout(() => {
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        setAddress("");
        setAmount("");
      }, 3000);
    }, 2000);
  };

  // Calculate Half and Max amounts
  const handleHalf = () => {
    if (!balanceData) return;
    const balance = parseFloat(
      formatUnits(balanceData.value, balanceData.decimals)
    );
    setAmount((balance / 2).toFixed(6));
  };

  const handleMax = () => {
    if (!balanceData) return;
    const balance = parseFloat(
      formatUnits(balanceData.value, balanceData.decimals)
    );
    // Estimate gas fee (rough estimate: 0.001 ETH for simple transfer)
    const estimatedGasFee = 0.001;
    const maxAmount = Math.max(0, balance - estimatedGasFee);
    setAmount(maxAmount.toFixed(6));
  };

  const usdValue = amount ? (parseFloat(amount) * 145.2).toFixed(2) : "0.00";

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isExpanded]);

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 0, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
              }}
              style={{
                borderRadius: "24px",
                transformOrigin: "top center",
              }}
              className="relative flex h-full w-full overflow-y-auto bg-[#fa6c01] transform-gpu will-change-transform pointer-events-auto"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute h-full inset-0 overflow-hidden pointer-events-none"
                style={{
                  borderRadius: "24px",
                }}
              >
                <MeshGradient
                  speed={1}
                  colors={["#fa6c01", "#c55501", "#e86201", "#d25801"]}
                  distortion={0.8}
                  swirl={0.1}
                  grainMixer={0}
                  grainOverlay={0}
                  className="inset-0 sticky top-0"
                  style={{ height: "100%", width: "100%" }}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="relative z-10 flex flex-col w-full mx-auto items-center p-6 sm:p-10 max-w-md gap-6"
              >
                {/* Header */}
                <div className="w-full flex items-center justify-between">
                  <h2 className="text-3xl sm:text-4xl font-bold text-white">
                    {activeTab === "transfer" ? "Transfer " : "Redeem "}
                  </h2>
                </div>

                {/* Tab Switcher */}
                <div className="w-full">
                  <div className="flex gap-2 p-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                    <button
                      type="button"
                      onClick={() => setActiveTab("transfer")}
                      className={`flex-1 px-6 py-3 rounded-full font-semibold transition-all ${
                        activeTab === "transfer"
                          ? "bg-white text-[#fa6c01]"
                          : "text-white hover:bg-white/10"
                      }`}
                    >
                      Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("redeem")}
                      className={`flex-1 px-6 py-3 rounded-full font-semibold transition-all ${
                        activeTab === "redeem"
                          ? "bg-white text-[#fa6c01]"
                          : "text-white hover:bg-white/10"
                      }`}
                    >
                      Redeem
                    </button>
                  </div>
                </div>

                {/* Connect Wallet Section */}
                <div className="w-full">
                  <ConnectButton.Custom>
                    {({
                      account,
                      chain,
                      openAccountModal,
                      openChainModal,
                      openConnectModal,
                      authenticationStatus,
                      mounted,
                    }) => {
                      // Note: If your app doesn't use authentication, you
                      // can remove all 'authenticationStatus' checks
                      const ready =
                        mounted && authenticationStatus !== "loading";
                      const connected =
                        ready &&
                        account &&
                        chain &&
                        (!authenticationStatus ||
                          authenticationStatus === "authenticated");

                      return (
                        <div
                          {...(!ready && {
                            "aria-hidden": true,
                            style: {
                              opacity: 0,
                              pointerEvents: "none",
                              userSelect: "none",
                            },
                          })}
                        >
                          {(() => {
                            if (!connected) {
                              return (
                                <button
                                  onClick={openConnectModal}
                                  type="button"
                                  className="w-full px-6 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-3"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <rect
                                      x="3"
                                      y="5"
                                      width="18"
                                      height="14"
                                      rx="2"
                                    />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                  </svg>
                                  Connect Wallet
                                </button>
                              );
                            }

                            if (chain.unsupported) {
                              return (
                                <button
                                  onClick={openChainModal}
                                  type="button"
                                  className="w-full px-6 py-4 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/40 text-red-200 font-semibold hover:bg-red-500/30 transition-all flex items-center justify-center gap-3"
                                >
                                  Wrong network
                                </button>
                              );
                            }

                            return (
                              <div className="flex gap-3">
                                <button
                                  onClick={openChainModal}
                                  type="button"
                                  className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
                                >
                                  {chain.hasIcon && (
                                    <div
                                      style={{
                                        background: chain.iconBackground,
                                        width: 20,
                                        height: 20,
                                        borderRadius: 999,
                                        overflow: "hidden",
                                      }}
                                    >
                                      {chain.iconUrl && (
                                        <img
                                          alt={chain.name ?? "Chain icon"}
                                          src={chain.iconUrl}
                                          style={{ width: 20, height: 20 }}
                                        />
                                      )}
                                    </div>
                                  )}
                                  {chain.name}
                                </button>

                                <button
                                  onClick={openAccountModal}
                                  type="button"
                                  className="flex-1 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-3"
                                >
                                  {account.displayName}
                                  {balanceData
                                    ? ` (${parseFloat(
                                        formatUnits(
                                          balanceData.value,
                                          balanceData.decimals
                                        )
                                      ).toFixed(4)} ${balanceData.symbol})`
                                    : ""}
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    }}
                  </ConnectButton.Custom>
                  {!isConnected && (
                    <p className="text-xs text-white/50 text-center mt-2">
                      Connect your wallet to start{" "}
                      {activeTab === "transfer" ? "transferring" : "redeeming"}
                    </p>
                  )}
                </div>

                {/* Transfer Form */}
                <div className="w-full space-y-6">
                  {/* Conditional Address Input - Only show for Transfer */}
                  {activeTab === "transfer" && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-normal text-white mb-2 tracking-[0.5px] uppercase">
                        To Address *
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder=" Address..."
                        className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm"
                      />
                    </div>
                  )}

                  {/* Redeem Code Input - Only show for Redeem */}
                  {activeTab === "redeem" && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-normal text-white mb-2 tracking-[0.5px] uppercase">
                        Redeem Code *
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter your redeem code..."
                        className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-mono tracking-wider"
                      />
                    </div>
                  )}

                  {/* Amount Input - Only show for Transfer */}
                  {activeTab === "transfer" && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-normal text-white mb-2 tracking-[0.5px] uppercase">
                        Amount *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          placeholder="0.00"
                          className="w-full px-4 py-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white text-3xl font-bold placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-white/60">
                          ≈ ${usdValue}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleHalf}
                          disabled={!balanceData}
                          className="rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-all border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Half
                        </button>
                        <button
                          type="button"
                          onClick={handleMax}
                          disabled={!balanceData}
                          className="rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-all border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Max
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={
                      !address ||
                      (activeTab === "transfer" && !amount) ||
                      status === "loading" ||
                      status === "success"
                    }
                    className={`group relative flex w-full items-center justify-center gap-2 rounded-full py-4 text-lg font-bold transition-all ${
                      status === "success"
                        ? "bg-green-500 text-white"
                        : "bg-white text-[#fa6c01] hover:bg-white/90 hover:shadow-lg hover:shadow-white/20"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <AnimatePresence mode="wait">
                      {status === "loading" ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>
                            {activeTab === "transfer"
                              ? "Encrypting..."
                              : "Processing..."}
                          </span>
                        </motion.div>
                      ) : status === "success" ? (
                        <motion.div
                          key="success"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center gap-2"
                        >
                          <Check className="h-5 w-5" />
                          <span>
                            {activeTab === "transfer"
                              ? "Sent Privately"
                              : "Redeemed Successfully"}
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <ShieldCheck className="h-5 w-5" />
                          <span>
                            {activeTab === "transfer"
                              ? "Send with Hidden Layer"
                              : "Redeem Code"}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>

                  {/* Status Message */}
                  {status === "success" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center text-sm text-green-300 font-medium"
                    >
                      ✓{" "}
                      {activeTab === "transfer"
                        ? "Transaction successfully routed through Hidden Layer."
                        : "Funds redeemed successfully to your wallet."}
                    </motion.div>
                  )}

                  {/* Privacy Notice */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-white/90 font-medium mb-1">
                          Hidden Layer Protection Active
                        </p>
                        <p className="text-xs text-white/60 leading-relaxed">
                          Your transaction is encrypted and routed through our
                          privacy layer, making it invisible to third-party
                          trackers while maintaining full blockchain
                          verification.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Close Button */}
              <motion.button
                onClick={handleClose}
                className="absolute cursor-pointer right-6 top-6 z-10 flex h-10 w-10 items-center justify-center text-white bg-transparent transition-colors hover:bg-white/10 rounded-full"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
