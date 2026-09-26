"use client";

import { Play, Info, Sparkles, Star } from "lucide-react";
import { Movie } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeroBannerProps {
  movie: Movie | null;
  onExplore: (movie: Movie) => void;
}

export default function HeroBanner({ movie, onExplore }: HeroBannerProps) {
  if (!movie) return null;

  return (
    <section className="relative w-full h-[480px] md:h-[560px] overflow-hidden">
      {/* Background Graphic Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/80 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-black/60 z-10" />
      <div className="absolute inset-0 bg-gradient-to-tr from-rose-950/60 via-purple-950/40 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto h-full px-4 md:px-8 flex flex-col justify-center max-w-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-[#e50914] text-white font-bold px-2.5 py-0.5 text-xs shadow-lg shadow-[#e50914]/40">
            <Sparkles className="h-3 w-3 mr-1 inline" /> Top Recommendation
          </Badge>
          {movie.release_year && (
            <Badge variant="outline" className="border-white/20 text-gray-300">
              {movie.release_year}
            </Badge>
          )}
          {movie.score && (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-black/50 px-2 py-0.5 rounded-full border border-white/10">
              <Star className="h-3.5 w-3.5 fill-amber-400" />
              <span>{movie.score.toFixed(1)} / 5.0</span>
            </div>
          )}
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-xl mb-3">
          {movie.clean_title || movie.title}
        </h1>

        {/* Genres */}
        <div className="flex flex-wrap gap-2 mb-4">
          {movie.genres_list?.map((g) => (
            <span
              key={g}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md text-gray-200 border border-white/15"
            >
              {g}
            </span>
          ))}
        </div>

        <p className="text-sm md:text-base text-gray-300 line-clamp-3 mb-6 leading-relaxed">
          {movie.explanation
            ? `Recommended by our ML engine: ${movie.explanation}. High affinity score based on crowd co-ratings and genre multi-hot features.`
            : "An acclaimed cinematic milestone featured by our Bayesian weighted rating engine."}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => onExplore(movie)}
            className="bg-[#e50914] hover:bg-[#ff2430] text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-[#e50914]/30 gap-2 text-sm"
          >
            <Play className="h-4 w-4 fill-white" /> Watch Trailer
          </Button>

          <Button
            variant="outline"
            onClick={() => onExplore(movie)}
            className="border-[#2e344d] bg-[#11131a]/80 backdrop-blur-md text-gray-200 hover:bg-[#1e2230] hover:text-white h-11 px-5 rounded-xl gap-2 text-sm"
          >
            <Info className="h-4 w-4" /> Inspect ML Signal
          </Button>
        </div>
      </div>
    </section>
  );
}
