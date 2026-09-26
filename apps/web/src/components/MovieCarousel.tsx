"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Movie } from "@/types";
import MovieCard from "@/components/MovieCard";
import { Button } from "@/components/ui/button";

interface MovieCarouselProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  movies: Movie[];
}

export default function MovieCarousel({
  title,
  subtitle,
  icon,
  movies,
}: MovieCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -480 : 480;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="relative my-8 px-4 md:px-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            {icon && <span className="text-[#e50914]">{icon}</span>}
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">{title}</h3>
          </div>
          {subtitle && <p className="text-xs md:text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Scroll Arrows */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            className="h-8 w-8 rounded-full border-[#222638] bg-[#11131a] text-gray-300 hover:bg-[#1e2230] hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            className="h-8 w-8 rounded-full border-[#222638] bg-[#11131a] text-gray-300 hover:bg-[#1e2230] hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4"
      >
        {movies.map((movie) => (
          <MovieCard key={movie.movie_id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
