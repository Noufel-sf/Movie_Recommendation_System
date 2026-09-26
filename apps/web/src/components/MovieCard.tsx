"use client";

import { Star, Sparkles, Play } from "lucide-react";
import { Movie } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
}

export default function MovieCard({ movie, onClick }: MovieCardProps) {
  return (
    <Card
      onClick={() => onClick(movie)}
      className="group relative flex-none w-48 md:w-52 cursor-pointer overflow-hidden rounded-xl border-[#222638] bg-[#11131a] transition-all duration-300 hover:-translate-y-2 hover:border-[#e50914] hover:shadow-2xl hover:shadow-[#e50914]/20"
    >
      {/* Poster Image Container */}
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

        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1017] via-transparent to-black/50" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-start justify-between gap-1">
          {movie.release_year && (
            <Badge variant="outline" className="bg-black/70 backdrop-blur-md border-white/20 text-[10px] text-gray-200 font-mono px-2 py-0">
              {movie.release_year}
            </Badge>
          )}

          {movie.match_score ? (
            <Badge className="bg-[#e50914] hover:bg-[#ff2430] text-white font-bold text-[11px] shadow-lg shadow-[#e50914]/30 px-2 py-0">
              <Sparkles className="h-2.5 w-2.5 mr-1 inline" />
              {Math.min(100, Math.round((movie.match_score / 5) * 100))}%
            </Badge>
          ) : movie.score ? (
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[11px] font-semibold text-amber-400">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <span>{movie.score.toFixed(1)}</span>
            </div>
          ) : null}
        </div>

        {/* Hover Action Button */}
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
          <div className="h-10 w-10 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg shadow-[#e50914]/50 transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="h-4 w-4 fill-white ml-0.5" />
          </div>
        </div>

        {/* Genre Tags on Poster */}
        <div className="absolute bottom-2 left-2 right-2 z-10 flex flex-wrap gap-1">
          {movie.genres_list?.slice(0, 2).map((g) => (
            <span
              key={g}
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-gray-300 border border-white/10"
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Card Content & Explanation Tag */}
      <CardContent className="p-3 bg-[#0e1017]">
        <h4 className="text-xs md:text-sm font-bold text-gray-100 line-clamp-1 group-hover:text-[#ff4b55] transition-colors">
          {movie.clean_title || movie.title}
        </h4>

        {/* Model-derived Explanation */}
        {movie.explanation ? (
          <div className="mt-1.5 text-[10px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md line-clamp-1">
            💡 {movie.explanation}
          </div>
        ) : (
          <div className="mt-1.5 text-[10px] text-gray-400 line-clamp-1">
            {movie.genres_list?.join(" • ") || "Cinema"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
