"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, ChevronRight, ChevronLeft, Calendar, Clock, Star, Sparkles, X, Film } from "lucide-react";
import { Movie } from "@/types";
import { Button } from "@/components/ui/button";

interface HeroBannerProps {
  spotlights: Movie[];
  onExplore?: (movie: Movie) => void;
}

export default function HeroBanner({ spotlights }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  if (!spotlights || spotlights.length === 0) return null;

  const currentMovie = spotlights[currentIndex] || spotlights[0];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % spotlights.length);
    setShowFullOverview(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + spotlights.length) % spotlights.length);
    setShowFullOverview(false);
  };

  const formatRuntime = (mins?: number) => {
    if (!mins) return "1 hour 45 minutes";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} minutes`;
    return `${h} hour ${m} minutes`;
  };

  return (
    <section className="relative w-full min-h-[640px] md:min-h-[720px] lg:min-h-[760px] overflow-hidden bg-[#090a0f] flex flex-col justify-between">
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

        {/* Cinematic Gradient Overlays matching Spider-Man Reference */}
        {/* Left Dark Gradient for Typography Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/85 md:via-[#090a0f]/75 to-transparent z-10" />

        {/* Bottom Gradient blending into next section & bottom carousel */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/50 to-transparent z-10" />

        {/* Top Vignette */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#090a0f]/80 to-transparent z-10" />
      </div>

      {/* Hero Content Section */}
      <div className="relative z-20 max-w-7xl w-full mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-8 flex-1 flex flex-col justify-center">
        <div className="max-w-2xl">
          {/* Top Tag: NEW MOVIE in signature red */}
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="bg-[#e50914] text-white font-black text-[11px] tracking-wider uppercase px-3 py-1 rounded-md shadow-lg shadow-[#e50914]/40">
              NEW MOVIE
            </span>
            {currentMovie.match_score && (
              <span className="bg-black/60 backdrop-blur-md border border-white/10 text-emerald-400 font-bold text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {Math.min(100, Math.round((currentMovie.match_score / 5) * 100))}% AI Match
              </span>
            )}
          </div>

          {/* Main Huge Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] mb-4">
            {currentMovie.clean_title || currentMovie.title}
          </h1>

          {/* Metadata Row matching Reference: IMDb 8.2 (12,827) | 2021 | 1 hour 55 minutes | Sci-fi */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs md:text-sm font-medium text-gray-300 mb-5">
            {/* IMDb Badge */}
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
              <span className="bg-[#f5c518] text-black font-black text-[10px] px-1 py-0.2 rounded font-mono">
                IMDb
              </span>
              <span className="text-white font-bold text-xs">
                {currentMovie.vote_average ? currentMovie.vote_average.toFixed(1) : "8.2"}
              </span>
              <span className="text-gray-400 text-[11px]">
                ({currentMovie.vote_count ? `${(currentMovie.vote_count / 1000).toFixed(1)}k` : "12.8k"})
              </span>
            </div>

            <span className="text-gray-500">•</span>

            {/* Release Year */}
            <span className="text-gray-200 font-semibold">
              {currentMovie.release_year || "2021"}
            </span>

            <span className="text-gray-500">•</span>

            {/* Runtime */}
            <span className="text-gray-300">
              {formatRuntime(currentMovie.runtime)}
            </span>

            <span className="text-gray-500">•</span>

            {/* Primary Genre */}
            <span className="text-gray-300">
              {currentMovie.genres_list?.slice(0, 2).join(", ") || "Action, Sci-fi"}
            </span>
          </div>

          {/* Synopsis with "See more" toggle matching Screenshot */}
          <div className="mb-6 max-w-xl">
            <p className={`text-xs sm:text-sm text-gray-300/90 leading-relaxed ${showFullOverview ? "" : "line-clamp-3"}`}>
              {currentMovie.overview ||
                "A cinematic spectacle recommended by our collaborative filtering and latent factor models. Experience the journey, visual grandeur, and thrilling narrative."}
              {currentMovie.overview && currentMovie.overview.length > 140 && (
                <button
                  type="button"
                  onClick={() => setShowFullOverview((prev) => !prev)}
                  className="cursor-pointer text-amber-400 hover:text-amber-300 font-semibold ml-1.5 focus:outline-none"
                >
                  {showFullOverview ? "See less" : "... See more"}
                </button>
              )}
            </p>
          </div>

          {/* Action Buttons: Watch trailer & Watch now */}
          <div className="flex items-center gap-3.5 mb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTrailerOpen(true)}
              className="cursor-pointer border-white/20 bg-black/40 backdrop-blur-md text-white hover:bg-white/15 h-11 px-6 rounded-lg text-sm font-semibold transition-all gap-2"
            >
              <Film className="h-4 w-4 text-[#e50914]" />
              Watch trailer
            </Button>

            <Link href={`/movies/${currentMovie.movie_id}`}>
              <Button
                className="cursor-pointer bg-[#e50914] hover:bg-[#ff2430] text-white font-extrabold h-11 px-7 rounded-lg text-sm flex items-center gap-2 shadow-xl shadow-[#e50914]/40 transition-transform hover:scale-105 active:scale-95"
              >
                <Play className="h-4 w-4 fill-white" /> Watch now
              </Button>
            </Link>
          </div>

          {/* Arrow Navigation Controls (< and >) on Bottom Left matching Screenshot */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSlide}
              className="cursor-pointer h-9 w-9 rounded-lg border border-white/20 bg-black/40 backdrop-blur-md text-gray-300 hover:text-white hover:border-[#e50914] hover:bg-[#e50914] flex items-center justify-center transition-all focus:outline-none"
              title="Previous movie"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="cursor-pointer h-9 w-9 rounded-lg border border-white/20 bg-black/40 backdrop-blur-md text-gray-300 hover:text-white hover:border-[#e50914] hover:bg-[#e50914] flex items-center justify-center transition-all focus:outline-none"
              title="Next movie"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Overlapping Poster Carousel Strip matching Screenshot */}
      <div className="relative z-30 w-full max-w-7xl mx-auto px-4 md:px-8 pb-6">
        <div className="flex items-end justify-start sm:justify-end gap-3.5 overflow-x-auto no-scrollbar py-4 px-1">
          {spotlights.slice(0, 8).map((movie, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={movie.movie_id}
                type="button"
                onClick={() => {
                  setCurrentIndex(index);
                  setShowFullOverview(false);
                }}
                className={`cursor-pointer group relative flex-none rounded-xl overflow-hidden transition-all duration-300 focus:outline-none ${
                  isActive
                    ? "w-28 sm:w-32 md:w-36 aspect-[2/3] -translate-y-4 ring-2 ring-[#e50914] shadow-2xl shadow-[#e50914]/50 z-20 scale-105"
                    : "w-20 sm:w-24 md:w-28 aspect-[2/3] opacity-65 hover:opacity-100 hover:scale-100 hover:-translate-y-1 z-10"
                }`}
                title={movie.clean_title || movie.title}
              >
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-[#181b26] flex items-center justify-center p-2 text-center text-[10px] text-gray-300 font-bold">
                    {movie.clean_title || movie.title}
                  </div>
                )}

                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Active Indicator Bar on bottom */}
                {isActive && (
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-[#e50914]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trailer Modal Popup */}
      {isTrailerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-[#11131a] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Film className="h-5 w-5 text-[#e50914]" />
                <h3 className="font-bold text-white text-base md:text-lg">
                  {currentMovie.clean_title || currentMovie.title} - Official Trailer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTrailerOpen(false)}
                className="cursor-pointer text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player Embed */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
                  (currentMovie.clean_title || currentMovie.title) + " official trailer"
                )}&autoplay=1`}
                title={`${currentMovie.title} Trailer`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
