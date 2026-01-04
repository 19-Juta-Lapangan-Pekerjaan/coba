"use client";

import Hero from "@/src/modules/home/Hero";
import About from "@/src/modules/home/About";
import Testimonials from "@/src/modules/home/Testimonials";
import TerminalOnboarding from "@/src/components/Layout/TerminalOnboarding";

export default function Home() {
  return (
    <>
      <TerminalOnboarding />
      <Hero />
      <About />
      <Testimonials />
    </>
  );
}
