"use client";

import { useState, useRef, useEffect } from "react";
import { useApp, AppTab } from "@/src/contexts/AppContext";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useDisconnect } from "wagmi";
import { mainnet, base, arbitrum, mantle, sepolia } from "wagmi/chains";
import Image from "next/image";
import Link from "next/link";
import * as motion from "motion/react-client";
import { AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowUpRight, ArrowDownLeft, Wallet, X, ExternalLink } from "lucide-react";

const tabs: { id: AppTab; label: string }[] = [
  { id: "dashboard", label: "DASHBOARD" },
  { id: "trade", label: "TRADE" },
  { id: "transfer", label: "TRANSFER" },
  { id: "compliance", label: "COMPLIANCE" },
];

// Supported chains for balance fetching
const supportedChains = [
  { chain: mainnet, name: "MAINNET", color: "bg-blue-500" },
  { chain: base, name: "BASE", color: "bg-blue-600" },
  { chain: arbitrum, name: "ARBITRUM", color: "bg-blue-400" },
  { chain: mantle, name: "MANTLE", color: "bg-emerald-500" },
  { chain: sepolia, name: "SEPOLIA", color: "bg-purple-500" },
];

export default function AppNavbar() {
  const { activeTab, setActiveTab } = useApp();
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { address, chain: currentChain } = useAccount();
  const { disconnect } = useDisconnect();

  // Fetch balances from all supported chains
  const { data: mainnetBalance } = useBalance({ address, chainId: mainnet.id });
  const { data: baseBalance } = useBalance({ address, chainId: base.id });
  const { data: arbitrumBalance } = useBalance({ address, chainId: arbitrum.id });
  const { data: mantleBalance } = useBalance({ address, chainId: mantle.id });
  const { data: sepoliaBalance } = useBalance({ address, chainId: sepolia.id });

  // Combine all balances
  const allBalances = [
    { ...supportedChains[0], balance: mainnetBalance },
    { ...supportedChains[1], balance: baseBalance },
    { ...supportedChains[2], balance: arbitrumBalance },
    { ...supportedChains[3], balance: mantleBalance },
    { ...supportedChains[4], balance: sepoliaBalance },
  ].filter(b => b.balance && parseFloat(b.balance.formatted) > 0);

  // Calculate total USD value
  const totalUsd = allBalances.reduce((sum, b) => {
    if (!b.balance) return sum;
    const ethPrice = 3500; // Mock price
    return sum + parseFloat(b.balance.formatted) * ethPrice;
  }, 0);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setWalletDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatBalance = (value: string | undefined) => {
    if (!value) return "0.0000";
    const num = parseFloat(value);
    return num.toFixed(4);
  };

  const formatUsd = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/favicon/favicon-32x32.png"
              alt="Gelap Logo"
              width={28}
              height={28}
              className="rounded"
            />
            <span className="text-white font-bold text-lg tracking-wide">
              GELAP
            </span>
          </Link>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${
                  activeTab === tab.id
                    ? "bg-zinc-800 text-white border border-zinc-700"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Right Side - Network & Wallet */}
          <div className="flex items-center gap-3">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

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
                    className="flex items-center gap-2"
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <motion.button
                            onClick={openConnectModal}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white text-xs font-medium rounded-lg hover:bg-zinc-700 transition-all"
                          >
                            ACCESS VAULT
                          </motion.button>
                        );
                      }

                      return (
                        <>
                          {/* Chain Selector - Clickable */}
                          <motion.button
                            onClick={openChainModal}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 px-3 py-2 bg-zinc-900/80 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
                          >
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-xs text-zinc-300 uppercase font-medium">
                              {chain.name}
                            </span>
                            <span className="text-zinc-600">|</span>
                            <span className="text-xs text-zinc-400">CONNECTED</span>
                            <ChevronDown className="w-3 h-3 text-zinc-500" />
                          </motion.button>

                          {/* Wallet Button - Opens Custom Dropdown */}
                          <div className="relative" ref={dropdownRef}>
                            <motion.button
                              onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
                            >
                              <span className="text-xs text-zinc-300 font-medium">
                                {account.displayBalance || "0 ETH"}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {account.displayName}
                              </span>
                              <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${walletDropdownOpen ? "rotate-180" : ""}`} />
                            </motion.button>

                            {/* Wallet Dropdown */}
                            <AnimatePresence>
                              {walletDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
                                >
                                  {/* Header */}
                                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                                    <div className="flex items-center gap-2">
                                      <Wallet className="w-4 h-4 text-purple-400" />
                                      <span className="text-white font-medium text-sm">Accounts</span>
                                      <ChevronDown className="w-3 h-3 text-zinc-500" />
                                    </div>
                                    <button 
                                      onClick={() => setWalletDropdownOpen(false)}
                                      className="text-zinc-500 hover:text-white transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* Tabs */}
                                  <div className="flex gap-4 px-4 py-2 border-b border-zinc-800">
                                    <button className="text-purple-400 text-sm font-medium">Assets</button>
                                    <button className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors">Transactions</button>
                                  </div>

                                  {/* Wallet Card */}
                                  <div className="mx-4 my-3 p-4 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl border border-zinc-700">
                                    <p className="text-zinc-400 text-xs mb-1">My Wallet</p>
                                    <p className="text-2xl font-bold text-white">
                                      {formatUsd(totalUsd)}
                                    </p>
                                  </div>

                                  {/* Assets List - All Chains */}
                                  <div className="px-4 pb-3 space-y-3 max-h-48 overflow-y-auto">
                                    {allBalances.length > 0 ? (
                                      allBalances.map((item) => (
                                        <div key={item.chain.id} className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 ${item.color} rounded-full flex items-center justify-center`}>
                                              <span className="text-white text-xs font-bold">Ξ</span>
                                            </div>
                                            <div>
                                              <p className="text-white text-sm font-medium">
                                                ETH <span className="text-zinc-500">Ether</span>
                                              </p>
                                              <p className="text-purple-400 text-xs uppercase">{item.name}</p>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-white text-sm font-medium">
                                              {formatBalance(item.balance?.formatted)}
                                            </p>
                                            <p className="text-zinc-500 text-xs">
                                              {formatUsd(parseFloat(item.balance?.formatted || "0") * 3500)}
                                            </p>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-center py-4">
                                        <p className="text-zinc-500 text-sm">No assets found</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex gap-2 px-4 py-3 border-t border-zinc-800">
                                    <button className="flex-1 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs font-medium hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1">
                                      <Wallet className="w-3 h-3" />
                                      Buy
                                    </button>
                                    <button className="flex-1 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs font-medium hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1">
                                      <ArrowUpRight className="w-3 h-3" />
                                      Send
                                    </button>
                                    <button className="flex-1 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs font-medium hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1">
                                      <ArrowDownLeft className="w-3 h-3" />
                                      Receive
                                    </button>
                                  </div>

                                  {/* Footer */}
                                  <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
                                    <button className="text-purple-400 text-xs font-medium flex items-center gap-1 hover:text-purple-300 transition-colors">
                                      Bridge Crypto? <ExternalLink className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        disconnect();
                                        setWalletDropdownOpen(false);
                                      }}
                                      className="text-red-400 text-xs font-medium hover:text-red-300 transition-colors"
                                    >
                                      Disconnect
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </nav>
  );
}

