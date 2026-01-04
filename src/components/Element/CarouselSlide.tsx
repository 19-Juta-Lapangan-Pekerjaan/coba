"use client";

import type React from "react";

import Image from "next/image";
import { cn } from "@/src/lib/utils";

interface CarouselSlideProps {
  image?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  imageClassName?: string;
  contentClassName?: string;
  overlay?: boolean;
}

export function CarouselSlide({
  image,
  title,
  description,
  children,
  className,
  imageClassName,
  contentClassName,
  overlay = true,
}: CarouselSlideProps) {
  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* Background image */}
      {image && (
        <div className="absolute inset-0">
          <Image
            src={image || "/placeholder.svg"}
            alt={title || "Carousel slide"}
            fill
            className={cn("object-cover", imageClassName)}
            priority
          />
          {overlay && (
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
          )}
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "relative z-10 h-full flex flex-col justify-end p-8 md:p-12",
          contentClassName,
        )}
      >
        {children || (
          <>
            {title && (
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 text-balance">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-lg md:text-xl text-white/90 max-w-2xl text-pretty">
                {description}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
