"use client";

// Polyfill for SSR
if (typeof window === "undefined") {
  (global as any).indexedDB = {
    open: () => ({
      result: {},
      addEventListener: () => { },
      removeEventListener: () => { },
      onsuccess: () => { },
      onerror: () => { },
    }),
  };
}

import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { mantleSepoliaTestnet, mantle } from "@mantleio/viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  connectorsForWallets,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";

// Create a QueryClient instance
const queryClient = new QueryClient();

// Explicit RPC endpoint for Mantle Sepolia
const MANTLE_SEPOLIA_RPC = "https://rpc.sepolia.mantle.xyz";

// Configure connectors
const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, coinbaseWallet, walletConnectWallet, injectedWallet],
    },
  ],
  {
    appName: "Gelap",
    projectId: "f8aabd752876f7f9ef70f2ed2ff74639",
  }
);

// Configure wagmi with explicit HTTP transports
const config = createConfig({
  chains: [mantleSepoliaTestnet, mantle, mainnet, sepolia],
  connectors,
  transports: {
    [mantleSepoliaTestnet.id]: http(MANTLE_SEPOLIA_RPC),
    [mantle.id]: http("https://rpc.mantle.xyz"),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: false,
});

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          theme={darkTheme({
            accentColor: "#006466",
            accentColorForeground: "white",
            borderRadius: "medium",
            overlayBlur: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
