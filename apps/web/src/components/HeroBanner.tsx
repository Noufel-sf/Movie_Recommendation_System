"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, ChevronRight, ChevronLeft, Calendar, Clock, Star, Sparkles } from "lucide-react";
import { Movie } from "@/types";
import { Button } from "@/components/ui/button";

interface HeroBannerProps {
  spotlights: Movie[];
  onExplore?: (movie: Movie) => void;
}

export default function HeroBanner({ spotlights }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!spotlights || spotlights.length === 0) return null;

  const currentMovie = spotlights[currentIndex] || spotlights[0];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % spotlights.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + spotlights.length) % spotlights.length);
  };

  return (
    <section className="relative w-full h-[520px] md:h-[600px] overflow-hidden bg-[#090a0f]">
      {/* Background Image / Backdrop */}
      {currentMovie.backdrop_url && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
          style={{ backgroundImage: `url(${currentMovie.backdrop_url})` }}
        />
      )}

      {/* Cinematic Gradient Overlays (matching reference image) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/80 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/30 to-black/60 z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none z-10" />

      {/* Spotlight Content Container */}
      <div className="relative z-20 max-w-7xl mx-auto h-full px-4 md:px-8 flex flex-col justify-center">
        <div className="max-w-2xl">
          {/* Spotlight Index Tag */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#38bdf8] bg-[#38bdf8]/15 border border-[#38bdf8]/30 px-2.5 py-0.5 rounded-full">
              #{currentIndex + 1} Spotlight
            </span>
            {currentMovie.match_score && (
              <span className="text-xs font-bold text-[#e50914] bg-[#e50914]/15 border border-[#e50914]/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {Math.min(100, Math.round((currentMovie.match_score / 5) * 100))}% Match
              </span>
            )}
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-2xl mb-4 transition-all duration-300">
            {currentMovie.clean_title || currentMovie.title}
          </h1>

          {/* Metadata Row matching reference: ● TV/MOVIE  ● Duration  ● Date */}
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-medium text-gray-300 mb-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#e50914]" />
              MOVIE
            </span>
            <span>●</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              {currentMovie.runtime || 120}m
            </span>
            <span>●</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {currentMovie.release_year || "2000"}
            </span>
            {currentMovie.vote_average && (
              <>
                <span>●</span>
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  {currentMovie.vote_average.toFixed(1)} IMDB
                </span>
              </>
            )}
          </div>

          {/* Synopsis */}
          <p className="text-xs md:text-sm text-gray-300/90 line-clamp-3 mb-6 leading-relaxed max-w-xl">
            {currentMovie.overview ||
              "One of the cinematic landmarks selected by our collaborative filtering and latent matrix factorization model."}
          </p>

          {/* Action Buttons: Watch Now (Pill) & Detail (Glass Pill) */}
          <div className="flex items-center gap-3">
            <Link href={`/movies/${currentMovie.movie_id}`}>
              <Button
                className="bg-[#e50914] hover:bg-[#ff2430] text-white font-extrabold h-11 px-7 rounded-full shadow-xl shadow-[#e50914]/40 gap-2 text-sm transition-transform active:scale-95"
              >
                <Play className="h-4 w-4 fill-white" /> Watch Now
              </Button>
            </Link>

            <Link href={`/movies/${currentMovie.movie_id}`}>
              <Button
                variant="outline"
                className="border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 h-11 px-6 rounded-full gap-1.5 text-sm transition-all"
              >
                Detail <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Carousel Navigation Arrows on the right edge */}
      <div className="absolute right-4 md:right-8 bottom-12 z-30 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={prevSlide}
          className="h-10 w-10 rounded-full border-white/20 bg-black/60 backdrop-blur-md text-white hover:bg-[#e50914] hover:border-[#e50914] transition-all"
          title="Previous Spotlight"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          className="h-10 w-10 rounded-full border-white/20 bg-black/60 backdrop-blur-md text-white hover:bg-[#e50914] hover:border-[#e50914] transition-all"
          title="Next Spotlight"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </section>
  );
}
