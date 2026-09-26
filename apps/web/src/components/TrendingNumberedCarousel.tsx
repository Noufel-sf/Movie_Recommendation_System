"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Movie } from "@/types";
import { Button } from "@/components/ui/button";

interface TrendingNumberedCarouselProps {
  movies: Movie[];
}

export default function TrendingNumberedCarousel({
  movies,
}: TrendingNumberedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -500 : 500;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="relative my-10 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-2xl md:text-3xl font-black text-[#38bdf8] tracking-tight flex items-center gap-2">
            Trending
          </h2>
          <span className="text-xs font-bold text-gray-400 bg-[#151824] px-2.5 py-0.5 rounded-full border border-[#222638]">
            Top 10 Live
          </span>
        </div>

        {/* Scroll Arrows */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            className="h-8 w-8 rounded-lg border-[#222638] bg-[#12141d] text-gray-300 hover:bg-[#e50914] hover:text-white hover:border-[#e50914] transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            className="h-8 w-8 rounded-lg border-[#222638] bg-[#12141d] text-gray-300 hover:bg-[#e50914] hover:text-white hover:border-[#e50914] transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Numbered Cards Row */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-3"
      >
        {movies.slice(0, 10).map((movie, index) => {
          const rank = index + 1;
          return (
            <Link
              key={movie.movie_id}
              href={`/movies/${movie.movie_id}`}
              className="group relative flex-none w-44 md:w-48 cursor-pointer rounded-xl overflow-hidden bg-[#11131a] border border-[#202436] hover:border-[#e50914] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#e50914]/20 block focus:outline-none"
            >
              {/* Poster Container */}
              <div className="relative h-64 md:h-72 w-full overflow-hidden bg-[#151824]">
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80";
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center p-4 text-center bg-gradient-to-t from-black to-slate-900">
                    <span className="text-xs font-bold text-gray-300">{movie.clean_title || movie.title}</span>
                  </div>
                )}

                {/* Bottom Shadow Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                {/* Big Stylized Rank Number at bottom-left */}
                <div className="absolute left-2.5 bottom-1 z-20 flex items-baseline">
                  <span className="text-5xl md:text-6xl font-black italic tracking-tighter text-[#38bdf8] drop-shadow-[0_2px_10px_rgba(56,189,248,0.5)]">
                    {rank}
                  </span>
                </div>

                {/* Hover Play Overlay */}
                <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                  <div className="h-11 w-11 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg shadow-[#e50914]/50 transform scale-75 group-hover:scale-100 transition-transform">
                    <Play className="h-5 w-5 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Title label underneath */}
              <div className="p-2.5 bg-[#0e1017]">
                <h4 className="text-xs md:text-sm font-bold text-gray-100 line-clamp-1 group-hover:text-[#ff4b55] transition-colors">
                  {movie.clean_title || movie.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                  <span>{movie.release_year || "Movie"}</span>
                  <span className="text-amber-400 font-semibold">★ {movie.score?.toFixed(1) || "4.2"}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
