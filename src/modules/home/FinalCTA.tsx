"use client";

import { ArrowRight, ShieldCheck, Users } from "lucide-react";
import { useTransfer } from "@/src/contexts/TransferContext";

export default function FinalCTA() {
  const { openTransfer } = useTransfer();

  return (
    <section className="relative min-h-screen bg-deep_space_blue-100 overflow-hidden py-20 px-4 flex items-center">
      {/* Rounded Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-gradient-radial from-midnight_violet-800/30 via-midnight_violet-800/10 to-transparent blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-[700px] h-[700px] rounded-full bg-gradient-radial from-stormy_teal-800/20 via-stormy_teal-800/5 to-transparent blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-radial from-dark_teal-800/15 via-dark_teal-800/5 to-transparent blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Main CTA Card */}
        <div className="glass rounded-[3rem] p-12 md:p-16 shadow-glow-lg">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-midnight_violet-800 to-stormy_teal-800 flex items-center justify-center mb-8 animate-float">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>

          {/* Headline */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            Ready to Protect Your{" "}
            <span className="bg-gradient-to-r from-midnight_violet-800 via-stormy_teal-800 to-dark_teal-800 bg-clip-text text-transparent">
              Privacy
            </span>
            ?
          </h2>

          {/* Subheadline */}
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto leading-relaxed">
            Start your first private transaction in 60 seconds. No signup, no
            KYC, no compromise.
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 mb-10 text-white">
            <Users className="w-5 h-5 text-stormy_teal-900" />
            <span className="text-sm">
              Join <strong className="text-white">100,000+</strong>{" "}
              privacy-conscious users
            </span>
          </div>

          {/* CTA Button */}
          <button
            onClick={openTransfer}
            className="group inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-midnight_violet-600 to-stormy_teal-600 hover:from-stormy_teal-600 hover:to-dark_teal-600 shadow-glow hover:shadow-glow-xl duration-300 font-bold text-white text-lg transition-all duration-300 hover:scale-105"
          >
            Transfer Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Trust Indicators */}
          <div className="mt-10 pt-10 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-center gap-8">
              {[
                { icon: "", text: "Military-Grade Encryption" },
                { icon: "", text: "Instant Transfers" },
                { icon: "", text: "Audited & Secure" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-white text-sm"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="glass-dark rounded-2xl p-6 text-left">
            <h3 className="text-lg font-bold text-white mb-2">
              Zero Learning Curve
            </h3>
            <p className="text-sm text-white">
              As easy as a regular blockchain transfer, with privacy built-in
              automatically
            </p>
          </div>
          <div className="glass-dark rounded-2xl p-6 text-left">
            <h3 className="text-lg font-bold text-white mb-2">
              Premium Privacy, Fair Price
            </h3>
            <p className="text-sm text-white">
              90% lower fees than traditional privacy solutions, pay only for
              what you use
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
