"use client";

import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia, base, arbitrum, mantle } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  getDefaultConfig,
  lightTheme,
} from "@rainbow-me/rainbowkit";

// Create a QueryClient instance
const queryClient = new QueryClient();

// Configure wagmi with RainbowKit
const config = getDefaultConfig({
  appName: "Gelap Privacy",
  projectId: "f8aabd752876f7f9ef70f2ed2ff74639", // Can be replaced with other walletconnect project IDs
  chains: [mainnet, sepolia, base, arbitrum, mantle],
  ssr: true,
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
          theme={lightTheme({
            accentColor: "#fa6c01",
            accentColorForeground: "white",
            borderRadius: "large",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
