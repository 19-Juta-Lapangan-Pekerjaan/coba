"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Hero from "@/src/modules/home/Hero";
import About from "@/src/modules/home/About";

// Lazy load komponen berat untuk performa lebih baik

const Testimonials = dynamic(() => import("@/src/modules/home/Testimonials"), {
  loading: () => <div className="min-h-[400px] bg-black" />,
});

const TerminalOnboarding = dynamic(
  () => import("@/src/components/Layout/TerminalOnboarding"),
  {
    ssr: false, // Terminal tidak perlu SSR
  }
);

export default function Home() {
  const [shouldLoadAbout, setShouldLoadAbout] = useState(false);
  const [shouldLoadTestimonials, setShouldLoadTestimonials] = useState(false);
  const aboutTriggerRef = useRef<HTMLDivElement>(null);
  const testimonialsTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === aboutTriggerRef.current) {
              setShouldLoadAbout(true);
            } else if (entry.target === testimonialsTriggerRef.current) {
              setShouldLoadTestimonials(true);
            }
          }
        });
      },
      { rootMargin: "200px" } // Load 200px sebelum terlihat
    );

    if (aboutTriggerRef.current) {
      observer.observe(aboutTriggerRef.current);
    }
    if (testimonialsTriggerRef.current) {
      observer.observe(testimonialsTriggerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <TerminalOnboarding />
      <Hero />
      <About />
      <div ref={testimonialsTriggerRef}>
        {shouldLoadTestimonials && <Testimonials />}
      </div>
    </>
  );
}
