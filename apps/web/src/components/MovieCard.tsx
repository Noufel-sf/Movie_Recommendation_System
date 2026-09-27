"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Sparkles, Heart, Eye } from "lucide-react";
import { Movie } from "@/types";
import { Badge } from "@/components/ui/badge";

interface MovieCardProps {
  movie: Movie;
  className?: string;
}

export default function MovieCard({ movie, className }: MovieCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  if (!movie) return null;

  // Compute rating display (vote_average, score, or fallback)
  const displayScore = movie.score
    ? movie.score.toFixed(1)
    : movie.vote_average
    ? movie.vote_average.toFixed(1)
    : "8.4";

  return (
    <Link
      href={`/movies/${movie.movie_id}`}
      className={`group block focus:outline-none cursor-pointer ${className || "w-44 md:w-52 flex-none"}`}
    >
      <div className="flex flex-col gap-2">
        {/* Poster Container matching Reference Screenshot */}
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-[#141721] border border-white/5 transition-all duration-300 group-hover:scale-[1.03] group-hover:border-[#e50914]/60 group-hover:shadow-2xl group-hover:shadow-[#e50914]/25">
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

          {/* Subtle gradient shadow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Top-Right ML Match Badge (if model provides match score) */}
          {movie.match_score && (
            <div className="absolute top-2.5 right-2.5 z-10">
              <Badge className="bg-[#e50914] hover:bg-[#ff2430] text-white font-bold text-[10px] shadow-lg shadow-[#e50914]/40 px-2 py-0.5 border-none">
                <Sparkles className="h-2.5 w-2.5 mr-1 inline" />
                {Math.min(100, Math.round((movie.match_score / 5) * 100))}%
              </Badge>
            </div>
          )}

          {/* Bottom subtle genre pill on hover */}
          {movie.genres_list && movie.genres_list.length > 0 && (
            <div className="absolute bottom-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-gray-300 border border-white/10">
                {movie.genres_list[0]}
              </span>
            </div>
          )}
        </div>

        {/* Info Section Underneath Poster (Matching Reference Image) */}
        <div className="px-0.5 pt-1">
          {/* Movie Title */}
          <h4 className="text-sm md:text-base font-bold text-gray-100 group-hover:text-[#e50914] transition-colors truncate">
            {movie.clean_title || movie.title}
          </h4>

          {/* Metadata Row: Year on Left | Heart + Eye + Rating on Right */}
          <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400 font-medium">
            {/* Year */}
            <span className="text-gray-400 text-xs font-semibold">
              {movie.release_year || "2020"}
            </span>

            {/* Action & Stats Icons */}
            <div className="flex items-center gap-2.5">
              {/* Like / Heart Icon */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsLiked((prev) => !prev);
                }}
                className="cursor-pointer transition-transform active:scale-125 focus:outline-none"
                title={isLiked ? "Unlike" : "Like"}
              >
                <Heart
                  className={`h-3.5 w-3.5 transition-colors ${
                    isLiked
                      ? "fill-[#e50914] text-[#e50914] drop-shadow-[0_0_8px_rgba(229,9,20,0.8)]"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                />
              </button>

              {/* Eye / Views Icon */}
              <div className="flex items-center text-gray-500 hover:text-gray-400 transition-colors">
                <Eye className="h-3.5 w-3.5" />
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1 font-bold text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs">{displayScore}</span>
              </div>
            </div>
          </div>

          {/* Model Explanation Pill (if collaborative or content based rec) */}
          {movie.explanation && (
            <div className="mt-1.5 text-[10px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md truncate">
              💡 {movie.explanation}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}