"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Movie } from "@/types";
import MovieCard from "@/components/MovieCard";
import MovieCardSkeleton from "@/components/MovieCardSkeleton";

interface MovieCarouselProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  movies: Movie[];
  isLoading?: boolean;
  headerAction?: React.ReactNode;
}

export default function MovieCarousel({
  title,
  subtitle,
  icon,
  movies,
  isLoading = false,
  headerAction,
}: MovieCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -480 : 480;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  if (!isLoading && (!movies || movies.length === 0)) return null;

  return (
    <section className="relative my-8 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            {icon && <span className="text-[#e50914]">{icon}</span>}
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">{title}</h3>
          </div>
          {subtitle && <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Header Actions (Model Tabs) & Scroll Buttons */}
        <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap justify-between lg:justify-end">
          {headerAction}

          {/* Scroll Arrows */}
          <div className="flex items-center gap-1.5 ml-auto lg:ml-0">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="cursor-pointer h-9 w-9 rounded-full border border-white/10 bg-white/5 hover:bg-[#e50914] hover:border-[#e50914] text-gray-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
              title="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="cursor-pointer h-9 w-9 rounded-full border border-white/10 bg-white/5 hover:bg-[#e50914] hover:border-[#e50914] text-gray-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
              title="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Container */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 px-1"
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <MovieCardSkeleton key={i} className="w-44 sm:w-48 md:w-52 flex-none" />
            ))
          : movies.map((movie) => (
              <MovieCard key={movie.movie_id} movie={movie} className="w-44 sm:w-48 md:w-52 flex-none" />
            ))}
      </div>
    </section>
  );
}
