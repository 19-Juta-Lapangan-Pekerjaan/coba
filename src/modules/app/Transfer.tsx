"use client";

import { useState } from "react";
import * as motion from "motion/react-client";
import { Shield, Copy, Check } from "lucide-react";

// Mock vault data
const vaults = [
  { id: "main-usdc", name: "Main Vault (USDC)", balance: 45000.00, currency: "USDC" },
  { id: "main-ustb", name: "USTB Vault", balance: 12287.52, currency: "USTB" },
  { id: "sub-fund-a", name: "Sub-fund A", balance: 5000.00, currency: "USDC" },
];

const beneficiaryTypes = [
  { id: "whitelisted", name: "Whitelisted Address" },
  { id: "internal", name: "Internal Vault" },
  { id: "external", name: "External (KYC Required)" },
];

export default function Transfer() {
  const [selectedVault, setSelectedVault] = useState(vaults[0]);
  const [beneficiaryType, setBeneficiaryType] = useState(beneficiaryTypes[0]);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (recipientAddress) {
      navigator.clipboard.writeText(recipientAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-white">INTERNAL TRANSFER</h1>
        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded border border-purple-500/30 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          ZK SHIELDED
        </span>
      </div>

      {/* Transfer Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
      >
        {/* Source & Beneficiary Type Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* FROM (SOURCE) */}
          <div>
            <label className="block text-purple-400 text-sm mb-2">FROM (SOURCE)</label>
            <div className="relative">
              <select
                value={selectedVault.id}
                onChange={(e) => {
                  const vault = vaults.find(v => v.id === e.target.value);
                  if (vault) setSelectedVault(vault);
                }}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-purple-500 transition-colors"
              >
                {vaults.map((vault) => (
                  <option key={vault.id} value={vault.id}>
                    {vault.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* BENEFICIARY TYPE */}
          <div>
            <label className="block text-purple-400 text-sm mb-2">BENEFICIARY TYPE</label>
            <div className="relative">
              <select
                value={beneficiaryType.id}
                onChange={(e) => {
                  const type = beneficiaryTypes.find(t => t.id === e.target.value);
                  if (type) setBeneficiaryType(type);
                }}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-purple-500 transition-colors"
              >
                {beneficiaryTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* RECIPIENT ADDRESS */}
        <div className="mb-6">
          <label className="block text-zinc-500 text-sm mb-2">
            RECIPIENT ADDRESS (MANTLE / ZK-ID)
          </label>
          <div className="relative">
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              onClick={handleCopy}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* TRANSFER AMOUNT */}
        <div className="mb-8">
          <label className="block text-zinc-500 text-sm mb-2">TRANSFER AMOUNT</label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-4 py-3 pr-20 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
              {selectedVault.currency}
            </span>
          </div>
          <p className="text-zinc-600 text-xs mt-2">
            Available: {selectedVault.balance.toLocaleString()} {selectedVault.currency}
          </p>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-medium hover:bg-zinc-700 transition-all"
        >
          SIGN TRANSFER REQUEST
        </motion.button>
      </motion.div>
    </div>
  );
}
