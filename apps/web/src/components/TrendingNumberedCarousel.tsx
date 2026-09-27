"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Flame, Star } from "lucide-react";
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
      const offset = direction === "left" ? -480 : 480;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section id="trending-section" className="relative my-8 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-amber-600 to-[#e50914] flex items-center justify-center shadow-md shadow-[#e50914]/30">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              Top 10 Trending Today
            </h2>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-bold text-gray-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
            Live Global Rank
          </span>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="cursor-pointer h-9 w-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
            title="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="cursor-pointer h-9 w-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
            title="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Numbered Cards Row */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
      >
        {movies.slice(0, 10).map((movie, index) => {
          const rank = index + 1;
          return (
            <Link
              key={movie.movie_id}
              href={`/movies/${movie.movie_id}`}
              className="group relative flex-none w-44 sm:w-48 md:w-52 cursor-pointer rounded-2xl overflow-hidden bg-[#11141f] border border-white/10 hover:border-[#e50914]/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[#e50914]/25 block focus:outline-none"
            >
              {/* Poster Container */}
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#161a29]">
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

                {/* Dark Vignette Bottom Shadow */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                {/* Large Stylized Rank Number at bottom-left */}
                <div className="absolute left-2.5 bottom-1 z-20 flex items-baseline">
                  <span className="text-5xl sm:text-6xl font-black italic tracking-tighter text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] stroke-black">
                    {rank}
                  </span>
                </div>

                {/* Hover Play Button */}
                <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/45 backdrop-blur-[2px]">
                  <div className="h-12 w-12 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-xl shadow-[#e50914]/50 transform scale-75 group-hover:scale-100 transition-transform">
                    <Play className="h-5 w-5 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Title & Metadata Underneath */}
              <div className="p-3 bg-[#0d0f17]">
                <h4 className="text-xs sm:text-sm font-bold text-gray-100 line-clamp-1 group-hover:text-[#e50914] transition-colors">
                  {movie.clean_title || movie.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                  <span>{movie.release_year || "Movie"}</span>
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="h-3 w-3 fill-amber-400" />
                    <span>{movie.score?.toFixed(1) || movie.vote_average?.toFixed(1) || "4.5"}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
