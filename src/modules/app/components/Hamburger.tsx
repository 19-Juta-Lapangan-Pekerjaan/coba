"use client";

import { cn } from "@/src/lib/utils";

export default function HamburgerButton({
  isOpen,
  setIsOpen,
  colorClassName,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  colorClassName?: string;
}) {
  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={
        "relative flex aspect-square w-[1.3rem] flex-col items-center justify-center gap-1 sm:h-[4vw] sm:w-[3vw] md:w-6 md:gap-1.5 lg:hidden"
      }
      aria-label="Toggle menu"
    >
      <span
        className={cn(
          "h-0.5 w-full transition-all duration-300",
          isOpen
            ? "absolute top-0 right-0 bottom-0 left-0 m-auto opacity-0"
            : "relative opacity-100",
          colorClassName
        )}
      />
      <span
        className={cn(
          "h-0.5 w-full transition-all duration-500",
          isOpen
            ? "absolute top-0 right-0 bottom-0 left-0 m-auto rotate-315"
            : "relative",
          colorClassName
        )}
      />
      <span
        className={cn(
          "absolute h-0.5 w-full transition-all duration-500",
          isOpen
            ? "top-0 right-0 bottom-0 left-0 m-auto rotate-45 opacity-100"
            : "opacity-100",
          colorClassName
        )}
      />
      <span
        className={cn(
          "h-0.5 w-full transition-all duration-300",
          isOpen ? "absolute opacity-0" : "relative opacity-100",
          colorClassName
        )}
      />
    </button>
  );
}
