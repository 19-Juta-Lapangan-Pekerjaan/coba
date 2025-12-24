"use client";

import { AppProvider, useApp } from "@/src/contexts/AppContext";
import AppNavbar from "@/src/modules/app/components/AppNavbar";
import Dashboard from "@/src/modules/app/Dashboard";
import Trade from "@/src/modules/app/Trade";
import Transfer from "@/src/modules/app/Transfer";
import Compliance from "@/src/modules/app/Compliance";
import { FileText } from "lucide-react";
import * as motion from "motion/react-client";

function AuthenticationScreen() {
  const { authenticate } = useApp();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
          <FileText className="w-12 h-12 text-zinc-500" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            INSTITUTIONAL ACCESS REQUIRED
          </h1>
          <p className="text-zinc-500 text-sm max-w-md">
            Verify your organization identity via TEE Attestation to access the
            confidential execution layer.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={authenticate}
          className="px-6 py-3 bg-transparent border border-zinc-700 text-white rounded-lg hover:bg-zinc-900 hover:border-zinc-600 transition-all font-medium"
        >
          Authenticate Session
        </motion.button>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, activeTab } = useApp();

  if (!isAuthenticated) {
    return <AuthenticationScreen />;
  }

  return (
    <div className="min-h-screen bg-black">
      <AppNavbar />
      <main className="pt-16">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "trade" && <Trade />}
        {activeTab === "transfer" && <Transfer />}
        {activeTab === "compliance" && <Compliance />}
      </main>
    </div>
  );
}

export default function AppPage() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
