"use client";

import { useState } from "react";
import * as motion from "motion/react-client";
import { Key, Shield, Plus } from "lucide-react";

// Mock viewing keys data
const viewingKeys = [
  {
    id: 1,
    name: "Deloitte_Audit_2024",
    scope: "Read-012 : T21-Q3",
    status: "ACTIVE",
    statusColor: "bg-green-500",
  },
  {
    id: 2,
    name: "Internal_Compliance",
    scope: "Full : All-History",
    status: "ACTIVE",
    statusColor: "bg-green-500",
  },
];

// Mock regulatory flags
const regulatoryFlags = {
  jurisdictionLock: ["SG", "HK", "UAE"],
  travelRuleCompliance: "ENFORCED",
  maxDailyVolume: "$5,000,000.00",
};

export default function Compliance() {
  const [keys, setKeys] = useState(viewingKeys);

  const handleGenerateKey = () => {
    // Mock generating a new key
    const newKey = {
      id: keys.length + 1,
      name: `NewKey_${Date.now().toString(36)}`,
      scope: "Pending : Setup Required",
      status: "PENDING",
      statusColor: "bg-yellow-500",
    };
    setKeys([...keys, newKey]);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <h1 className="text-xl font-bold text-white mb-8">
        COMPLIANCE & AUDITOR ACCESS
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Viewing Keys Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-4 h-4 text-green-400" />
            <h2 className="text-green-400 font-semibold">Viewing Keys Management</h2>
          </div>
          <p className="text-zinc-500 text-sm mb-6">
            Manage keys that allow auditors or regulators to decrypt specific
            transaction sets without granting spending power.
          </p>

          {/* Keys List */}
          <div className="space-y-3 mb-6">
            {keys.map((key) => (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-cyan-400 font-medium text-sm">{key.name}</p>
                  <p className="text-zinc-500 text-xs">{key.scope}</p>
                </div>
                <span className={`px-2 py-1 ${key.statusColor} text-black text-xs font-medium rounded`}>
                  {key.status}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Generate New Key Button */}
          <motion.button
            onClick={handleGenerateKey}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-500 text-sm hover:border-zinc-600 hover:text-zinc-400 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            GENERATE NEW KEY
          </motion.button>
        </motion.div>

        {/* Regulatory Flags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h2 className="text-cyan-400 font-semibold">Regulatory Flags</h2>
          </div>

          <div className="space-y-6">
            {/* Jurisdiction Lock */}
            <div className="flex items-start justify-between">
              <span className="text-zinc-500 text-sm">Jurisdiction Lock</span>
              <div className="flex gap-2">
                {regulatoryFlags.jurisdictionLock.map((country) => (
                  <span
                    key={country}
                    className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded border border-zinc-700"
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>

            {/* Travel Rule Compliance */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-sm">Travel Rule Compliance</span>
              <span className="text-cyan-400 text-sm font-medium">
                {regulatoryFlags.travelRuleCompliance}
              </span>
            </div>

            {/* Max Daily Volume */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-sm">Max Daily Volume</span>
              <span className="text-white text-sm">
                {regulatoryFlags.maxDailyVolume}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
