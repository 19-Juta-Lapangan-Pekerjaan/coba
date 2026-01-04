"use client";

import { useState, useEffect } from "react";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/src/components/ui/terminal";

export default function TerminalOnboarding() {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Check if user has seen the onboarding before
    const hasSeenOnboarding = localStorage.getItem("gelap-onboarding-seen");
    if (hasSeenOnboarding) {
      setIsVisible(false);
      return;
    }

    // Auto dismiss after terminal animation completes (8 seconds)
    const timer = setTimeout(() => {
      handleDismiss();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem("gelap-onboarding-seen", "true");
    }, 500);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleDismiss}
    >
      {/* Solid background with radial gradient */}
      <div className="absolute inset-0 bg-radial-[at_50%_50%] from-dark_teal_3-400 to-black" />

      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,100,102,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,100,102,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Terminal container - centered */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4">
        <div className="flex justify-center items-center">
          <Terminal>
            <TypingAnimation>&gt; gelap init --network mainnet</TypingAnimation>
            <AnimatedSpan delay={1500}>
              ✔ Connecting to Gelap Privacy Protocol...
            </AnimatedSpan>
            <AnimatedSpan delay={2000}>
              ✔ Encrypt wallet with zero-knowledge proof
            </AnimatedSpan>
            <AnimatedSpan delay={2500}>✔ Dark pool initialized</AnimatedSpan>
            <TypingAnimation delay={3000}>
              &gt; gelap transfer --amount 1.5 ETH --private
            </TypingAnimation>
            <AnimatedSpan delay={4500}>
              ✔ Generating stealth address...
            </AnimatedSpan>
            <AnimatedSpan delay={5000}>✔ Transaction obfuscated</AnimatedSpan>
            <AnimatedSpan delay={5500}>
              ✔ Dark transfer complete. Untraceable.
            </AnimatedSpan>
            <AnimatedSpan
              delay={6500}
              className="text-stormy_teal-700 font-semibold"
            >
              Ready for private Web3 transactions.
            </AnimatedSpan>
          </Terminal>
        </div>

        {/* Skip hint */}
        <p className="text-center text-white/40 text-sm mt-6 animate-pulse">
          Click anywhere to skip
        </p>
      </div>
    </div>
  );
}
