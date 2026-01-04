"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

export interface CarouselSlide {
  id: string | number;
  content: React.ReactNode;
  image?: string;
  title?: string;
  description?: string;
}

interface SlidingCarouselProps {
  slides: CarouselSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  className?: string;
  slideClassName?: string;
  transitionDuration?: number;
  dragEnabled?: boolean;
}

export function SlidingCarousel({
  slides,
  autoPlay = false,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
  className,
  slideClassName,
  transitionDuration = 500,
  dragEnabled = true,
}: SlidingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Navigate to specific slide
  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;

      const newIndex =
        ((index % slides.length) + slides.length) % slides.length;
      setIsTransitioning(true);
      setCurrentIndex(newIndex);

      setTimeout(() => {
        setIsTransitioning(false);
      }, transitionDuration);
    },
    [isTransitioning, slides.length, transitionDuration],
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  useEffect(() => {
    if (!autoPlay) return;

    autoPlayRef.current = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, autoPlayInterval, nextSlide]);

  const handleMouseEnter = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (autoPlay && !isDragging) {
      autoPlayRef.current = setInterval(() => {
        nextSlide();
      }, autoPlayInterval);
    }
  };

  const handleDragStart = (clientX: number) => {
    if (!dragEnabled) return;
    setIsDragging(true);
    setDragStart(clientX);
    setDragOffset(0);

    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging || !dragEnabled) return;
    const offset = clientX - dragStart;
    setDragOffset(offset);
  };

  const handleDragEnd = () => {
    if (!isDragging || !dragEnabled) return;

    const threshold = 50;

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }

    setIsDragging(false);
    setDragOffset(0);

    if (autoPlay) {
      autoPlayRef.current = setInterval(() => {
        nextSlide();
      }, autoPlayInterval);
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "ArrowRight") {
        nextSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  return (
    <div
      ref={carouselRef}
      className={cn("relative w-full overflow-hidden", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides container */}
      <div
        className={cn(
          "flex transition-transform",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          !isDragging && "ease-out",
        )}
        style={{
          transform: `translateX(calc(-${
            currentIndex * 100
          }% + ${dragOffset}px))`,
          transitionDuration: isDragging ? "0ms" : `${transitionDuration}ms`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={cn("min-w-full shrink-0", slideClassName)}
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            {slide.content}
          </div>
        ))}
      </div>

      {/* Navigation controls */}
      {showControls && slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            disabled={isTransitioning}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 z-10",
              "bg-white/90 hover:bg-white text-gray-900",
              "rounded-full p-2 shadow-lg",
              "transition-all duration-200",
              "hover:scale-110 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
            )}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            disabled={isTransitioning}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 z-10",
              "bg-white/90 hover:bg-white text-gray-900",
              "rounded-full p-2 shadow-lg",
              "transition-all duration-200",
              "hover:scale-110 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
            )}
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                currentIndex === index
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75",
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
