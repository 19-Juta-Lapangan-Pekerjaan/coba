"use client";

import { ArrowUpRight } from "lucide-react";
import { CardScanner } from "@/src/components/Layout/CardScanner";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="flex text-center justify-center items-center flex-col bg-radial to-black from-dark_teal_3-400 min-h-screen">
      <CardScanner />
      <div className="flex justify-center flex-col mt-4 items-center gap-4">
        <h1 className="bg-gradient-to-br from-white to-[#EFF4FF] bg-clip-text text-4xl font-bold tracking-tighter text-transparent sm:text-6xl">
          The{" "}
          <span className="inline-block bg-gradient-to-r from-stormy_teal-900 via-dark_teal-800 to-midnight_violet-800 bg-clip-text text-stormy_teal-900 transition-all duration-700 ease-in-out  cursor-pointer">
            Easiest
          </span>{" "}
          Hidden Layer <br />
          Web3 Transfer Experience
        </h1>
        <p className="text-lg text-white sm:text-xl mb-2">
          Fast, private, and invisible blockchain transfers—powered by next-gen
          encryption.
        </p>
        <div className="inline-block relative">
          <Link href="/app">
            <button className="h-15 px-6 sm:px-8 rounded-full bg-gradient-to-r from-midnight_violet-600 to-stormy_teal-600 hover:from-stormy_teal-600 hover:to-dark_teal-600 shadow-glow hover:shadow-glow-xl duration-300 hover:text-white hover:shadow-lg font-semibold hover:shadow-white cursor-pointer transition-all duration-500 py-3 text-lg sm:text-xl font-regular text-[#E3E3E3] tracking-[-0.01em] relative">
              Launch Now <ArrowUpRight className="inline-block" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
