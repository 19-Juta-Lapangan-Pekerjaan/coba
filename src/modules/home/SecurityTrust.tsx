"use client";

import {
  ShieldCheck,
  Code2,
  Lock,
  AlertCircle,
  TrendingUp,
  Users,
} from "lucide-react";

export default function SecurityTrust() {
  const securityFeatures = [
    { icon: Code2, label: "Open-source protocol", checked: true },
    {
      icon: ShieldCheck,
      label: "Audited by top security firms",
      checked: true,
    },
    { icon: Lock, label: "Non-custodial - You control funds", checked: true },
    { icon: AlertCircle, label: "No logs kept", checked: true },
    { icon: ShieldCheck, label: "Smart contract verified", checked: true },
    { icon: TrendingUp, label: "Bug bounty program active", checked: true },
  ];

  const stats = [
    { value: "$50M+", label: "Total Value Protected", icon: Lock },
    { value: "500K+", label: "Private Transactions", icon: ShieldCheck },
    { value: "99.99%", label: "Uptime Guarantee", icon: TrendingUp },
    { value: "50+", label: "Countries Served", icon: Users },
  ];

  return (
    <section className="relative min-h-screen bg-deep_space_blue-100 overflow-hidden py-20 px-4">
      {/* Rounded Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[800px] h-[800px] rounded-full bg-gradient-radial from-stormy_teal-800/10 via-stormy_teal-800/3 to-transparent blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-radial from-midnight_violet-800/15 via-midnight_violet-800/5 to-transparent blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-stormy_teal-600 to-stormy_teal-800 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Your{" "}
            <span className="bg-gradient-to-r from-stormy_teal-800 to-stormy_teal-900 bg-clip-text text-transparent">
              Security
            </span>{" "}
            is Our Priority
          </h2>
          <p className="text-lg text-white max-w-2xl mx-auto">
            Built with industry-leading security practices and audited by the
            best
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="glass rounded-3xl p-8 mb-12">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">
            Security Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-2xl bg-background/50 hover:bg-background/70 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stormy_teal-800/20 to-stormy_teal-900/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-5 h-5 text-stormy_teal-800" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    {feature.label}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-stormy_teal-800/20 flex items-center justify-center">
                    <span className="text-stormy_teal-800 text-xs font-bold">
                      ✓
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="glass-dark rounded-2xl p-6 text-center hover:shadow-glow transition-all group"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-midnight_violet-800/20 to-dark_teal-800/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <stat.icon className="w-6 h-6 text-dark_teal-900" />
              </div>
              <div className="text-3xl font-bold text-gradient mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-white uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Certifications & Audits */}
        <div className="glass rounded-3xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Certifications & Audits
          </h3>

          {/* Dummy Badge Placeholders */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
            {[
              "Security Audit",
              "Smart Contract Verified",
              "Bug Bounty",
              "Open Source",
            ].map((badge, index) => (
              <div
                key={index}
                className="w-32 h-32 rounded-2xl bg-background/50 flex items-center justify-center text-white text-sm font-semibold text-center p-4 hover:bg-background/70 transition-all"
              >
                {badge}
              </div>
            ))}
          </div>

          {/* Trust Message */}
          <div className="text-center">
            <p className="text-white italic">
              &ldquo;Audited by leading blockchain security firms. Code is
              open-source and available for community review.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
