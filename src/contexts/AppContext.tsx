"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type AppTab = "dashboard" | "trade" | "transfer" | "compliance";

interface WalletGenerationStep {
  id: number;
  title: string;
  description: string;
  status: "pending" | "loading" | "complete";
}

interface AppContextType {
  // Authentication
  isAuthenticated: boolean;
  authenticate: () => void;
  
  // Navigation
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  
  // Privacy Wallet Generation
  isGeneratingWallet: boolean;
  privacyWalletGenerated: boolean;
  walletGenerationSteps: WalletGenerationStep[];
  startWalletGeneration: () => Promise<void>;
  resetWalletGeneration: () => void;
}

const initialWalletSteps: WalletGenerationStep[] = [
  {
    id: 1,
    title: "Initializing TEE Environment",
    description: "Setting up Trusted Execution Environment for secure key generation",
    status: "pending",
  },
  {
    id: 2,
    title: "Generating Privacy Keys",
    description: "Creating ZK-compatible keypair using secure entropy",
    status: "pending",
  },
  {
    id: 3,
    title: "Deriving Shielded Address",
    description: "Computing stealth address for private transactions",
    status: "pending",
  },
  {
    id: 4,
    title: "Registering with Protocol",
    description: "Linking privacy wallet to your connected account",
    status: "pending",
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);
  const [privacyWalletGenerated, setPrivacyWalletGenerated] = useState(false);
  const [walletGenerationSteps, setWalletGenerationSteps] = useState<WalletGenerationStep[]>(initialWalletSteps);

  const authenticate = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const startWalletGeneration = useCallback(async () => {
    if (isGeneratingWallet || privacyWalletGenerated) return;
    
    setIsGeneratingWallet(true);
    setWalletGenerationSteps(initialWalletSteps);

    // Simulate step-by-step wallet generation
    for (let i = 0; i < initialWalletSteps.length; i++) {
      // Set current step to loading
      setWalletGenerationSteps(prev => 
        prev.map((step, idx) => ({
          ...step,
          status: idx === i ? "loading" : idx < i ? "complete" : "pending"
        }))
      );

      // Simulate processing time (800-1500ms per step)
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

      // Mark current step as complete
      setWalletGenerationSteps(prev =>
        prev.map((step, idx) => ({
          ...step,
          status: idx <= i ? "complete" : "pending"
        }))
      );
    }

    setIsGeneratingWallet(false);
    setPrivacyWalletGenerated(true);
  }, [isGeneratingWallet, privacyWalletGenerated]);

  const resetWalletGeneration = useCallback(() => {
    setPrivacyWalletGenerated(false);
    setWalletGenerationSteps(initialWalletSteps);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        authenticate,
        activeTab,
        setActiveTab,
        isGeneratingWallet,
        privacyWalletGenerated,
        walletGenerationSteps,
        startWalletGeneration,
        resetWalletGeneration,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
