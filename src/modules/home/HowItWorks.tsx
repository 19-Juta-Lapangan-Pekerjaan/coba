"use client";

import { FileText, Shield, CheckCircle, ArrowRight } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: FileText,
      title: "Enter Details",
      description:
        "Simply input recipient address and amount—just like any normal transaction",
      step: "01",
    },
    {
      icon: Shield,
      title: "Encrypted Through Hidden Layer",
      description:
        "Your transaction is encrypted with military-grade security and routed through our privacy protocol",
      step: "02",
    },
    {
      icon: CheckCircle,
      title: "Transaction Arrives Privately",
      description:
        "Funds arrive at destination with complete anonymity—no trace, no history, no footprint",
      step: "03",
    },
  ];

  return (
    <section className="relative min-h-screen bg-deep_space_blue-100 overflow-hidden py-20 px-4">
      {/* Rounded Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-midnight_violet-800/20 via-midnight_violet-800/5 to-transparent blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-radial from-stormy_teal-800/15 via-stormy_teal-800/3 to-transparent blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            How{" "}
            <span className="bg-gradient-to-r from-stormy_teal-800 to-dark_teal-800 bg-clip-text text-transparent">
              Hidden Layer
            </span>{" "}
            Works
          </h2>
          <p className="text-lg text-white max-w-2xl mx-auto">
            Privacy protection in three simple steps. No complexity, just
            complete anonymity.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Lines */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-midnight_violet-800 via-stormy_teal-800 to-dark_teal-800 opacity-30 -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="glass rounded-3xl p-8 hover:shadow-glow transition-all duration-300 group h-full">
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-midnight_violet-800 to-stormy_teal-800 flex items-center justify-center text-white font-bold text-lg shadow-glow">
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-midnight_violet-800/20 to-stormy_teal-800/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <step.icon className="w-8 h-8 text-stormy_teal-900" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-3 text-center">
                    {step.title}
                  </h3>
                  <p className="text-white text-center leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-20">
                    <ArrowRight className="w-8 h-8 text-stormy_teal-900 animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Visual */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Traditional */}
          <div className="glass-dark rounded-3xl p-8 border-2 border-red-500/30">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
             Traditional Blockchain
            </h4>
            <ul className="space-y-3">
              {[
                "Transaction visible to everyone",
                "Wallet balance exposed",
                "History permanently public",
                "No privacy protection",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-white">
                  <span className="text-red-400">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Hidden Layer */}
          <div className="glass rounded-3xl p-8 border-2 border-stormy_teal-800/30">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              With Hidden Layer
            </h4>
            <ul className="space-y-3">
              {[
                "Complete transaction anonymity",
                "Wallet balance hidden",
                "Zero transaction history",
                "Military-grade encryption",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-white">
                  <span className="text-stormy_teal-800">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
