"use client";

import { useState } from "react";
import * as motion from "motion/react-client";
import { Shield, Lock, Eye, ArrowLeftRight } from "lucide-react";

// Mock token data
const tokens = [
  { id: "usdc", symbol: "USDC", name: "USD Coin", icon: "$", balance: 45000.00 },
  { id: "ustb", symbol: "USTB", name: "US T-Bill Fund", icon: "U", balance: 12287.52, yield: 5.2 },
  { id: "eth", symbol: "ETH", name: "Ethereum", icon: "E", balance: 2.5 },
];

type OrderType = "market" | "limit" | "twap";

export default function Trade() {
  const [sellToken, setSellToken] = useState(tokens[0]);
  const [buyToken, setBuyToken] = useState(tokens[1]);
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("market");

  const handleSwapTokens = () => {
    const temp = sellToken;
    setSellToken(buyToken);
    setBuyToken(temp);
    setSellAmount(buyAmount);
    setBuyAmount(sellAmount);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-zinc-400" />
          <h1 className="text-xl font-bold text-white">DARK POOL EXECUTION</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded border border-cyan-500/30">
            TEE ENCLAVE: ACTIVE
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
                  <span className="text-zinc-500 text-sm">SELL (SOURCE ASSET)</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-lg font-bold text-white">
                    {sellToken.icon}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{sellToken.symbol}</p>
                    <p className="text-zinc-500 text-xs">
                      Balance: {sellToken.balance.toLocaleString()}
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-2xl text-white placeholder-zinc-600 outline-none"
                />
              </div>

              {/* Swap Button */}
              <motion.button
                onClick={handleSwapTokens}
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4 text-zinc-400" />
              </motion.button>

              {/* Buy Section */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-zinc-500 text-sm">BUY (TARGET ASSET)</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-lg font-bold text-white">
                      {buyToken.icon}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{buyToken.symbol}</p>
                    </div>
                  </div>
                  {buyToken.yield && (
                    <span className="text-cyan-400 text-sm">
                      Yield: {buyToken.yield}%
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-2xl text-white placeholder-zinc-600 outline-none"
                />
              </div>
            </div>

            {/* Order Type Selection */}
            <div className="flex items-center gap-4 mt-6">
              {[
                { id: "market" as OrderType, label: "Market (Dark)" },
                { id: "limit" as OrderType, label: "Limit (Shielded)" },
                { id: "twap" as OrderType, label: "TWAP" },
              ].map((type) => (
                <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="orderType"
                    checked={orderType === type.id}
                    onChange={() => setOrderType(type.id)}
                    className="w-4 h-4 text-cyan-500 bg-zinc-800 border-zinc-600 focus:ring-cyan-500 focus:ring-offset-zinc-900"
                  />
                  <span className={`text-sm ${
                    orderType === type.id ? "text-white" : "text-zinc-500"
                  }`}>
                    {type.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Execute Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full mt-6 py-4 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 font-medium hover:bg-zinc-700 hover:text-white transition-all"
            >
              ENTER VOLUME
            </motion.button>
          </div>
        </motion.div>

        {/* Right Side - Order Book & Settlement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-4"
        >
          {/* Order Book (Obfuscated) */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-zinc-400 text-sm mb-4">ORDER BOOK (OBFUSCATED)</h3>
            
            {/* Blurred Order Book Visual */}
            <div className="relative h-32 mb-4 overflow-hidden rounded-lg">
              <div className="absolute inset-0 flex">
                <div className="w-1/2 bg-gradient-to-r from-red-500/20 to-transparent">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={`sell-${i}`}
                      className="h-6 bg-red-500/30 mb-0.5"
                      style={{ width: `${70 + Math.random() * 30}%` }}
                    />
                  ))}
                </div>
                <div className="w-1/2 bg-gradient-to-l from-green-500/20 to-transparent">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={`buy-${i}`}
                      className="h-6 bg-green-500/30 mb-0.5 ml-auto"
                      style={{ width: `${70 + Math.random() * 30}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 backdrop-blur-sm" />
            </div>

            <button className="w-full py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 text-sm flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors">
              <Eye className="w-4 h-4" />
              PRIVILEGED VIEW
            </button>

            <p className="text-xs text-zinc-600 mt-4">
              Liquidity is aggregated from institutional dark pools. Execution is
              guaranteed via the TEE enclave without pre-trade linkage.
            </p>
          </div>

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
                <span className="text-cyan-400">Gelap SG-1 Enclave</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Fees</span>
                <span className="text-cyan-400">0.05% (Institutional)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
