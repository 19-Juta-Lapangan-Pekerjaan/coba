"use client";

import React, { useEffect, useState } from "react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useTransfer } from "@/src/contexts/TransferContext";

interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
  blank: boolean;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
}

export function NavBar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name);
  const [showTransferButton, setShowTransferButton] = useState(false);
  const { openTransfer } = useTransfer();

  const handleOpenTransfer = () => {
    openTransfer();
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const screenHeight = window.innerHeight;
      setShowTransferButton(scrollPosition > screenHeight);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed sm:top-0 bottom-0 sm:bottom-auto pb-4 left-1/2 -translate-x-1/2 z-50 sm:pt-6",
        className
      )}
    >
      <div className="flex w-fit items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg transition-all duration-300">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;

          return (
            <Link
              key={item.name}
              href={item.url}
              target={item.blank ? "_blank" : "_self"}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-sm font-semibold sm:px-6 sm:py-2 py-3 px-4 rounded-full transition-colors",
                "text-white hover:text-white/80",
                isActive && "bg-muted text-black hover:text-black/50"
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={20} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-stormy_teal-900/10 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-t-full">
                    <div className="absolute w-12 h-6 bg-white/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-white/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-white/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </Link>
          );
        })}

        <AnimatePresence mode="wait">
          {showTransferButton && (
            // <span className="hidden md:inline">{item.name}</span>
            //   <span className="md:hidden">
            //     <Icon size={18} strokeWidth={2.5} />
            //   </span>

            <motion.button
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
              }}
              onClick={handleOpenTransfer}
              className="relative px-6 py-2 rounded-full font-semibold text-sm bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-lg"
            >
              <span className="hidden md:inline">Transfer</span>
              <span className="md:hidden">
                <ArrowUpRight size={18} strokeWidth={2.5} />
              </span>
              <div className="absolute inset-0 bg-midnight_violet-800/20 rounded-full blur-md -z-10" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
