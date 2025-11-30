import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { NavBarPage } from "@/src/components/Element/Navbar/Navbar";
import { TransferProvider } from "@/src/contexts/TransferContext";
import { TransferModal } from "@/src/components/Modal/TransferModal";
import { Web3Provider } from "@/src/providers/Web3Provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GeLabs",
  description:
    "GeLabs is a platform dedicated to innovative web development and privacy-focused solutions.",

  generator: "Next.js",
  applicationName: "GeLabs",
  alternates: {
    canonical: "https://gelapprivacy.vercel.app/",
  },

  // Favicon and icon definitions
  icons: {
    icon: [
      {
        url: `/favicon/favicon-16x16.png`,
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: `/favicon/favicon-32x32.png`,
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: `/favicon/android-chrome-512x512.png`,
        sizes: "512x512",
        type: "image/png",
      },
      { url: `/favicon/favicon.ico` },
    ],
    apple: [
      {
        url: `/favicon/apple-touch-icon.png`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: [{ url: `/favicon/favicon.ico` }],
    other: [
      {
        rel: "android-chrome-192x192",
        url: `/favicon/android-chrome-192x192.png`,
        sizes: "192x192",
      },
      {
        rel: "android-chrome-512x512",
        url: `/favicon/android-chrome-512x512.png`,
        sizes: "512x512",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider>
          <TransferProvider>
            <NavBarPage />
            <TransferModal />
            {children}
          </TransferProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
