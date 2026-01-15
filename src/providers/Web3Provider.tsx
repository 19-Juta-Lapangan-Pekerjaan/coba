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
import { WagmiProvider } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { mantleSepoliaTestnet, mantle } from "@mantleio/viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from "@rainbow-me/rainbowkit";

// Create a QueryClient instance
const queryClient = new QueryClient();

// Configure wagmi with RainbowKit
const config = getDefaultConfig({
  appName: "Gelap",
  projectId: "f8aabd752876f7f9ef70f2ed2ff74639", // Can be replaced with other walletconnect project IDs
  chains: [mantleSepoliaTestnet, mantle, mainnet, sepolia],
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
