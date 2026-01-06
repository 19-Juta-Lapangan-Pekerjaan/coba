"use client";

import dynamic from "next/dynamic";
import MagicBento from "@/src/components/ui/MagicBento";
import {
  useIsMobile,
  usePrefersReducedMotion,
} from "@/src/hooks/useMediaQuery";

// Lazy load Globe karena library COBE cukup berat
const Globe = dynamic(
  () => import("@/src/components/ui/globe").then((mod) => mod.Globe),
  {
    loading: () => (
      <div className="w-full h-[600px] flex items-center justify-center">
        <div className="animate-pulse text-stormy_teal-500">
          Loading globe...
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function About() {
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldDisableAnimations = isMobile || prefersReducedMotion;

  return (
    <section
      id="about"
      className="flex text-center justify-center items-center flex-col bg-radial-[at_50%_25%] from-dark_teal_3-400 to-black"
    >
      <MagicBento
        textAutoHide={true}
        enableStars={!shouldDisableAnimations}
        enableSpotlight={!shouldDisableAnimations}
        enableBorderGlow={true}
        enableTilt={!shouldDisableAnimations}
        enableMagnetism={!shouldDisableAnimations}
        clickEffect={!shouldDisableAnimations}
        spotlightRadius={300}
        particleCount={isMobile ? 3 : 6}
        glowColor="0, 100, 102"
        disableAnimations={shouldDisableAnimations}
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
