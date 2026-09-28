"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Play,
  ChevronRight,
  ChevronLeft,
  Star,
  Plus,
  Check,
  ThumbsUp,
  Volume2,
  VolumeX,
  Film,
  X,
  Sparkles,
} from "lucide-react";
import { Movie } from "@/types";
import { Button } from "@/components/ui/button";

interface HeroBannerProps {
  spotlights: Movie[];
  onExplore?: (movie: Movie) => void;
}

export default function HeroBanner({ spotlights }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inWatchlist, setInWatchlist] = useState<Record<number, boolean>>({});
  const [isLiked, setIsLiked] = useState<Record<number, boolean>>({});
  const [isMuted, setIsMuted] = useState(true);

  if (!spotlights || spotlights.length === 0) return null;

  const currentMovie = spotlights[currentIndex] || spotlights[0];
  const totalSlides = Math.min(spotlights.length, 8);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const toggleWatchlist = (id: number) => {
    setInWatchlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleLike = (id: number) => {
    setIsLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Format genres with pipe separator: "Action | Drama | Romance"
  const formattedGenres =
    currentMovie.genres_list && currentMovie.genres_list.length > 0
      ? currentMovie.genres_list.slice(0, 3).join(" | ")
      : "Action | Drama | Sci-Fi";

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8">
      {/* Cinematic Rounded Hero Card */}
      <section className="relative w-full min-h-[540px] sm:min-h-[580px] md:min-h-[620px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#090a0f] flex flex-col justify-between p-6 sm:p-10 md:p-12 transition-all">
        {/* Background Backdrop Image with smooth crossfade */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {currentMovie.backdrop_url ? (
            <img
              key={currentMovie.movie_id}
              src={currentMovie.backdrop_url}
              alt={currentMovie.title}
              className="h-full w-full object-cover object-center transition-all duration-700 scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-black via-slate-900 to-black" />
          )}

          {/* Dark Radial & Vignette Gradient Overlays for Centered Readability */}
          <div className="absolute inset-0 bg-black/40 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-black/35 to-black/60 z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f]/80 via-transparent to-[#090a0f]/80 z-10" />
        </div>

        {/* Top Header Row (AI Match badge / Featured indicator) */}
        <div className="relative z-20 flex items-center justify-between w-full">
          {currentMovie.match_score ? (
            <span className="bg-black/60 backdrop-blur-md border border-white/15 text-emerald-400 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              {Math.min(100, Math.round((currentMovie.match_score / 5) * 100))}% AI Match
            </span>
          ) : (
            <span className="bg-black/60 backdrop-blur-md border border-white/15 text-gray-300 font-medium text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
              <Film className="h-3.5 w-3.5 text-[#e50914]" />
              Spotlight
            </span>
          )}

          <span className="text-[11px] font-semibold text-gray-400 bg-black/40 backdrop-blur-md border border-white/10 px-2.5 py-0.5 rounded-full">
            Featured
          </span>
        </div>

        {/* Center Main Hero Content (Completely Centered Layout) */}
        <div className="relative z-20 max-w-3xl w-full mx-auto text-center my-auto py-8 flex flex-col items-center">
          {/* Rating and Genres Row: ★ 8.5 Action | Drama | Romance */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-medium text-gray-200 mb-3 drop-shadow-md">
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-white text-sm sm:text-base">
                {currentMovie.vote_average ? currentMovie.vote_average.toFixed(1) : "8.5"}
              </span>
            </div>
            <span className="text-gray-500">•</span>
            <span className="text-gray-300 font-normal tracking-wide">
              {formattedGenres}
            </span>
            {currentMovie.release_year && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400">{currentMovie.release_year}</span>
              </>
            )}
          </div>

          {/* Main Huge Centered Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] leading-tight mb-4">
            {currentMovie.clean_title || currentMovie.title}
          </h1>

          {/* Centered Overview Paragraph */}
          <p className="text-xs sm:text-sm md:text-base text-gray-300/90 leading-relaxed max-w-2xl mx-auto drop-shadow line-clamp-3 mb-8">
            {currentMovie.overview ||
              "With the help of remaining allies, they must assemble once more in order to undo the chaos in the universe, no matter what consequences may be in store, and no matter who they face... Avenge the fallen."}
          </p>

          {/* Centered Action Buttons Row matching Screenshot */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            {/* Play Now Red Pill Button */}
            <Link href={`/movies/${currentMovie.movie_id}`}>
              <Button
                className="cursor-pointer bg-[#e50914] hover:bg-[#ff1e2b] text-white font-extrabold h-12 px-8 rounded-full text-sm sm:text-base flex items-center gap-2.5 shadow-xl shadow-[#e50914]/40 transition-transform hover:scale-105 active:scale-95"
              >
                <Play className="h-4 w-4 fill-white text-white" />
                Play Now
              </Button>
            </Link>

            {/* Watchlist (+) Button */}
            <button
              type="button"
              onClick={() => toggleWatchlist(currentMovie.movie_id)}
              className="cursor-pointer w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none shadow-lg"
              title={inWatchlist[currentMovie.movie_id] ? "In Watchlist" : "Add to Watchlist"}
            >
              {inWatchlist[currentMovie.movie_id] ? (
                <Check className="h-5 w-5 text-emerald-400" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </button>

            {/* Like (Thumbs Up) Button */}
            <button
              type="button"
              onClick={() => toggleLike(currentMovie.movie_id)}
              className={`cursor-pointer w-12 h-12 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none shadow-lg ${
                isLiked[currentMovie.movie_id]
                  ? "bg-[#e50914] text-white border-[#e50914]"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title="Like"
            >
              <ThumbsUp className={`h-5 w-5 ${isLiked[currentMovie.movie_id] ? "fill-white" : ""}`} />
            </button>

            {/* Sound / Mute Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              className="cursor-pointer w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none shadow-lg"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-gray-300" />
              ) : (
                <Volume2 className="h-5 w-5 text-emerald-400" />
              )}
            </button>
          </div>
        </div>

        {/* Bottom Navigation Row: [ ← ] ......... [ — — — ] ......... [ → ] */}
        <div className="relative z-20 flex items-center justify-between w-full pt-4 mt-auto">
          {/* Previous Arrow Button */}
          <button
            type="button"
            onClick={prevSlide}
            className="cursor-pointer h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-white/15 bg-black/50 hover:bg-white/15 text-white backdrop-blur-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none shadow-lg"
            title="Previous movie"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Carousel Slide Indicators */}
          <div className="flex items-center gap-2">
            {spotlights.slice(0, totalSlides).map((_, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`cursor-pointer transition-all duration-300 rounded-full focus:outline-none ${
                    isActive
                      ? "w-8 h-1.5 bg-[#e50914] shadow-md shadow-[#e50914]/50"
                      : "w-2.5 h-1.5 bg-white/30 hover:bg-white/60"
                  }`}
                  title={`Slide ${index + 1}`}
                />
              );
            })}
          </div>

          {/* Next Arrow Button */}
          <button
            type="button"
            onClick={nextSlide}
            className="cursor-pointer h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-white/15 bg-black/50 hover:bg-white/15 text-white backdrop-blur-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none shadow-lg"
            title="Next movie"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
