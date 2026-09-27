"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Movie } from "@/types";
import MovieCard from "@/components/MovieCard";
import MovieCardSkeleton from "@/components/MovieCardSkeleton";
import { Button } from "@/components/ui/button";

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
    <section className="relative my-8 px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            {icon && <span className="text-[#e50914]">{icon}</span>}
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">{title}</h3>
          </div>
          {subtitle && <p className="text-xs md:text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Optional Header Actions (e.g. Model Switcher Tabs) & Scroll Arrows */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {headerAction}

          {/* Scroll Arrows */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              className="cursor-pointer h-8 w-8 rounded-full border-[#222638] bg-[#11131a] text-gray-300 hover:bg-[#e50914] hover:text-white hover:border-[#e50914] transition-all"
              title="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              className="cursor-pointer h-8 w-8 rounded-full border-[#222638] bg-[#11131a] text-gray-300 hover:bg-[#e50914] hover:text-white hover:border-[#e50914] transition-all"
              title="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Container */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4"
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <MovieCardSkeleton key={i} className="w-44 md:w-52 flex-none" />
            ))
          : movies.map((movie) => (
              <MovieCard key={movie.movie_id} movie={movie} />
            ))}
      </div>
    </section>
  );
}
