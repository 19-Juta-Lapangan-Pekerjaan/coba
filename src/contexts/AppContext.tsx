"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { type Address, type Hex } from "viem";

import {
  PrivacyWallet,
  createPrivacyWallet,
  type Note,
} from "@/src/wallet-sdk";
import { KeyDerivation } from "@/src/wallet-sdk/keyDerivation";

// ============================================================================
// Types
// ============================================================================

export type AppTab =
  | "dashboard"
  | "trade"
  | "transfer"
  | "compliance"
  | "deposit"
  | "withdraw";

interface WalletGenerationStep {
  id: number;
  title: string;
  description: string;
  status: "pending" | "loading" | "complete" | "error";
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

  // Privacy Wallet Instance
  privacyWallet: PrivacyWallet | null;

  // Shielded Balance
  shieldedBalance: bigint;
  balanceByToken: Map<Address, bigint>;
  isLoadingBalance: boolean;
  refreshBalance: () => Promise<void>;

  // Notes (UTXOs)
  notes: Note[];
  unspentNotes: Note[];

  // Public Keys (for receiving)
  publicKeys: { viewPublicKey: Hex; spendPublicKey: Hex } | null;

  // Sync Status
  lastSyncedBlock: bigint;
  isSyncing: boolean;
  syncWithChain: () => Promise<void>;
}

// ============================================================================
// Initial Steps
// ============================================================================

const initialWalletSteps: WalletGenerationStep[] = [
  {
    id: 1,
    title: "Initializing SP1 Environment",
    description: "Setting up SP1 ZK-VM for secure confidential execution",
    status: "pending",
  },
  {
    id: 2,
    title: "Generating Privacy Keys",
    description: "Sign message to derive your view and spend keys",
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
    title: "Syncing with Protocol",
    description: "Fetching on-chain state and syncing notes",
    status: "pending",
  },
];

// ============================================================================
// Context
// ============================================================================

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Navigation state
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");

  // Wallet generation state
  const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);
  const [privacyWalletGenerated, setPrivacyWalletGenerated] = useState(false);
  const [walletGenerationSteps, setWalletGenerationSteps] =
    useState<WalletGenerationStep[]>(initialWalletSteps);

  // Privacy wallet instance
  const [privacyWallet, setPrivacyWallet] = useState<PrivacyWallet | null>(
    null
  );

  // Balance state
  const [shieldedBalance, setShieldedBalance] = useState<bigint>(0n);
  const [balanceByToken, setBalanceByToken] = useState<Map<Address, bigint>>(
    new Map()
  );
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);

  // Sync state
  const [lastSyncedBlock, setLastSyncedBlock] = useState<bigint>(0n);
  const [isSyncing, setIsSyncing] = useState(false);

  // =========================================================================
  // Computed Values
  // =========================================================================

  const unspentNotes = useMemo(() => notes.filter((n) => !n.spent), [notes]);

  const publicKeys = useMemo(() => {
    if (!privacyWallet) return null;
    return privacyWallet.getPublicKeys();
  }, [privacyWallet]);

  // =========================================================================
  // Actions
  // =========================================================================

  const authenticate = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  /**
   * Update wallet step status
   */
  const updateStep = useCallback(
    (stepId: number, status: WalletGenerationStep["status"]) => {
      setWalletGenerationSteps((prev) =>
        prev.map((step) => (step.id === stepId ? { ...step, status } : step))
      );
    },
    []
  );

  /**
   * Start real wallet generation with signature-based key derivation
   */
  const startWalletGeneration = useCallback(async () => {
    if (isGeneratingWallet || privacyWalletGenerated) return;
    if (!walletClient || !publicClient) return;

    setIsGeneratingWallet(true);
    setWalletGenerationSteps(initialWalletSteps);

    try {
      // Step 1: Initialize environment
      updateStep(1, "loading");
      await new Promise((resolve) => setTimeout(resolve, 500));
      const wallet = createPrivacyWallet();
      updateStep(1, "complete");

      // Step 2: Generate keys (requires user signature)
      updateStep(2, "loading");
      await wallet.initialize(walletClient, publicClient);
      updateStep(2, "complete");

      // Step 3: Derive shielded address
      updateStep(3, "loading");
      const stealthAddr = wallet.generateReceiveAddress();
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateStep(3, "complete");

      // Step 4: Sync with chain (optional - don't fail if RPC has issues)
      updateStep(4, "loading");
      try {
        await wallet.syncWithChain();
      } catch (syncError) {
        console.warn("Chain sync failed (non-critical):", syncError);
        // Continue anyway - sync can be done later
      }
      updateStep(4, "complete");

      // Update state
      setPrivacyWallet(wallet);
      setShieldedBalance(wallet.getShieldedBalance());
      setBalanceByToken(wallet.getBalanceByToken());
      setNotes(wallet.getUnspentNotes());
      setPrivacyWalletGenerated(true);
    } catch (error) {
      console.error("Wallet generation failed:", error);

      // Check if user rejected the signature
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isUserRejection =
        errorMessage.includes("rejected") ||
        errorMessage.includes("denied") ||
        errorMessage.includes("cancelled") ||
        errorMessage.includes("user rejected");

      // Mark current step as error with appropriate message
      setWalletGenerationSteps((prev) =>
        prev.map((step) =>
          step.status === "loading"
            ? {
                ...step,
                status: "error",
                description: isUserRejection
                  ? "Signature rejected. Click 'Retry' to try again."
                  : step.description,
              }
            : step
        )
      );
    } finally {
      setIsGeneratingWallet(false);
    }
  }, [
    isGeneratingWallet,
    privacyWalletGenerated,
    walletClient,
    publicClient,
    updateStep,
  ]);

  /**
   * Reset wallet generation state
   */
  const resetWalletGeneration = useCallback(() => {
    setPrivacyWalletGenerated(false);
    setWalletGenerationSteps(initialWalletSteps);
    setPrivacyWallet(null);
    setShieldedBalance(0n);
    setBalanceByToken(new Map());
    setNotes([]);
  }, []);

  /**
   * Refresh balance from wallet
   */
  const refreshBalance = useCallback(async () => {
    if (!privacyWallet) return;

    setIsLoadingBalance(true);
    try {
      await privacyWallet.syncWithChain();
      setShieldedBalance(privacyWallet.getShieldedBalance());
      setBalanceByToken(privacyWallet.getBalanceByToken());
      setNotes(privacyWallet.getUnspentNotes());
    } catch (error) {
      console.error("Failed to refresh balance:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [privacyWallet]);

  /**
   * Sync with blockchain
   */
  const syncWithChain = useCallback(async () => {
    if (!privacyWallet) return;

    setIsSyncing(true);
    try {
      await privacyWallet.syncWithChain();
      setShieldedBalance(privacyWallet.getShieldedBalance());
      setBalanceByToken(privacyWallet.getBalanceByToken());
      setNotes(privacyWallet.getUnspentNotes());
    } catch (error) {
      console.error("Failed to sync with chain:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [privacyWallet]);

  // =========================================================================
  // Effects
  // =========================================================================

  /**
   * Reset when wallet disconnects
   */
  useEffect(() => {
    if (!isConnected) {
      resetWalletGeneration();
      setIsAuthenticated(false);
    }
  }, [isConnected, resetWalletGeneration]);

  // =========================================================================
  // Provider
  // =========================================================================

  return (
    <AppContext.Provider
      value={{
        // Authentication
        isAuthenticated,
        authenticate,

        // Navigation
        activeTab,
        setActiveTab,

        // Wallet Generation
        isGeneratingWallet,
        privacyWalletGenerated,
        walletGenerationSteps,
        startWalletGeneration,
        resetWalletGeneration,

        // Privacy Wallet
        privacyWallet,

        // Balance
        shieldedBalance,
        balanceByToken,
        isLoadingBalance,
        refreshBalance,

        // Notes
        notes,
        unspentNotes,

        // Public Keys
        publicKeys,

        // Sync
        lastSyncedBlock,
        isSyncing,
        syncWithChain,
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
