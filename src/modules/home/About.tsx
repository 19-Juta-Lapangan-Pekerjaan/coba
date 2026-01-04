"use client";

import MagicBento from "@/src/components/ui/MagicBento";
import { Globe } from "@/src/components/ui/globe";

export default function About() {
  return (
    <section className="flex text-center justify-center items-center flex-col bg-radial-[at_50%_25%] from-dark_teal_3-400 to-black">
      <MagicBento
        textAutoHide={true}
        enableStars={true}
        enableSpotlight={true}
        enableBorderGlow={true}
        enableTilt={true}
        enableMagnetism={true}
        clickEffect={true}
        spotlightRadius={300}
        particleCount={12}
        glowColor="0, 100, 102"
      />
      <div className="flex flex-col w-full max-w-[75em] items-center justify-center text-center mt-16 -mb-10 px-4">
        <h2 className="bg-gradient-to-br from-white via-white to-stormy_teal-900 bg-clip-text text-4xl font-bold tracking-tighter text-transparent sm:text-6xl mb-4">
          We are connected globally
          <br />
          through blockchain!
        </h2>
        <p className="text-lg text-white/70 sm:text-xl max-w-2xl">
          Connected across blockchains worldwide.
          <br />
          Your transactions stay private, everywhere.
        </p>
      </div>
      <div className="relative flex w-full max-w-[75em] items-center justify-center min-h-[600px]">
        <div className="absolute inset-0 flex items-center justify-center">
          <Globe className="scale-100" />
        </div>
      </div>
    </section>
  );
}
