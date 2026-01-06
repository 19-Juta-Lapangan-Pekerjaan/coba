import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import { TransferProvider } from "@/src/contexts/TransferContext";
import { TransferModal } from "@/src/components/Modal/TransferModal";
import { Web3Provider } from "@/src/providers/Web3Provider";
import { Footer } from "@/src/components/Element/Footer/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gelap - App",
  description: "Institutional Access Layer",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-b from-black via-[#2c1040] to-black`}
    >
      <Web3Provider>
        <TransferProvider>
          <TransferModal />
          {children}
          <Footer />
        </TransferProvider>
      </Web3Provider>
    </div>
  );
}
