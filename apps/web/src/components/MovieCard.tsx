"use client";

import { Star, Sparkles, Info } from "lucide-react";
import { Movie } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
}

export default function MovieCard({ movie, onClick }: MovieCardProps) {
  // Generate a deterministic aesthetic gradient based on the movie_id
  const gradients = [
    "from-purple-900/80 via-indigo-950 to-black",
    "from-rose-950/80 via-red-950 to-black",
    "from-blue-950/80 via-cyan-950 to-black",
    "from-emerald-950/80 via-teal-950 to-black",
    "from-amber-950/80 via-orange-950 to-black",
    "from-fuchsia-950/80 via-pink-950 to-black",
  ];
  const gradient = gradients[movie.movie_id % gradients.length];

  return (
    <Card
      onClick={() => onClick(movie)}
      className="group relative flex-none w-56 cursor-pointer overflow-hidden rounded-2xl border-[#222638] bg-[#11131a] transition-all duration-300 hover:-translate-y-2 hover:border-[#e50914]/60 hover:shadow-2xl hover:shadow-[#e50914]/20"
    >
      {/* Cinematic Poster Area */}
      <div className={`relative h-72 w-full bg-gradient-to-t ${gradient} p-4 flex flex-col justify-between overflow-hidden`}>
        {/* Subtle grid pattern texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-start justify-between gap-1">
          {movie.release_year && (
            <Badge variant="outline" className="bg-black/60 backdrop-blur-md border-white/10 text-[11px] text-gray-300 font-mono">
              {movie.release_year}
            </Badge>
          )}

          {movie.match_score ? (
            <Badge className="bg-[#e50914] text-white font-bold text-xs shadow-md">
              <Sparkles className="h-3 w-3 mr-1 inline" />
              {Math.min(100, Math.round((movie.match_score / 5) * 100))}% Match
            </Badge>
          ) : movie.score ? (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-xs font-semibold text-amber-400">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{movie.score.toFixed(1)}</span>
            </div>
          ) : null}
        </div>

        {/* Poster Center Title Graphic */}
        <div className="relative z-10 my-auto text-center px-2">
          <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#e50914]/20 group-hover:border-[#e50914]/50 transition-all">
            <Info className="h-5 w-5 text-gray-400 group-hover:text-white" />
          </div>
          <h4 className="font-extrabold text-base line-clamp-2 text-white drop-shadow-md group-hover:text-[#ff4b55] transition-colors">
            {movie.clean_title || movie.title}
          </h4>
        </div>

        {/* Bottom Genre Pills */}
        <div className="relative z-10 flex flex-wrap gap-1">
          {movie.genres_list?.slice(0, 2).map((g) => (
            <span
              key={g}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-gray-300 border border-white/10"
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Card Content & Explanation Tag */}
      <CardContent className="p-3 bg-[#11131a]">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span className="truncate">{movie.clean_title || movie.title}</span>
        </div>

        {/* Explainability Badge */}
        {movie.explanation && (
          <div className="mt-2 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-1 rounded-lg line-clamp-2">
            💡 {movie.explanation}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
