"use client";

import { ArrowUpRight } from "lucide-react";
import { CardScanner } from "@/src/components/Layout/CardScanner";
import Link from "next/link";
import { ShimmerButton } from "@/src/components/ui/shimmer-button";

export default function Hero() {
  return (
    <div className="flex text-center justify-center items-center flex-col bg-radial-[at_50%_75%] to-black from-dark_teal_3-400 min-h-screen">
      <div className="mt-10" />
      <CardScanner />
      <div className="flex justify-center flex-col mt-8 items-center gap-4">
        <h1 className="bg-gradient-to-br from-white via-white to-stormy_teal-900 bg-clip-text text-4xl font-bold tracking-tighter text-transparent sm:text-6xl">
          The <span className="underline underline-offset-4">Easiest</span>{" "}
          Hidden Layer <br />
          Web3 Transfer Experience
        </h1>
        <p className="text-lg text-white sm:text-xl mb-2">
          Fast, private, and invisible blockchain transfers—powered by next-gen
          encryption.
        </p>
        <div className="inline-block relative">
          <Link href="/app">
            <ShimmerButton className="px-8 py-4 text-lg">
              Launch Now <ArrowUpRight className="inline-block w-5 h-5" />
            </ShimmerButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
