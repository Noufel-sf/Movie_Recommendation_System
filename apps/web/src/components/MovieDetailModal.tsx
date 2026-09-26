"use client";

import { useState } from "react";
import { Star, Sparkles, X, Check, Play, Film, Clock, Calendar, Share2, Layers } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Movie } from "@/types";
import { fetchSimilar, submitRating } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MovieDetailModalProps {
  movie: Movie | null;
  currentUserId: number;
  onClose: () => void;
  onSelectSimilar: (movie: Movie) => void;
}

export default function MovieDetailModal({
  movie,
  currentUserId,
  onClose,
  onSelectSimilar,
}: MovieDetailModalProps) {
  const queryClient = useQueryClient();
  const [selectedRating, setSelectedRating] = useState<number>(5.0);
  const [ratedSuccess, setRatedSuccess] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  // Fetch similar movies for this title
  const { data: similarData, isLoading: isLoadingSimilar } = useQuery({
    queryKey: ["similar", movie?.movie_id],
    queryFn: () => (movie ? fetchSimilar(movie.movie_id, 8) : Promise.resolve({ similar_movies: [] })),
    enabled: !!movie,
  });

  // Submit rating mutation
  const ratingMutation = useMutation({
    mutationFn: () => (movie ? submitRating(currentUserId, movie.movie_id, selectedRating) : Promise.reject()),
    onSuccess: () => {
      setRatedSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["recommendations", currentUserId] });
      setTimeout(() => {
        setRatedSuccess(false);
        setIsRatingOpen(false);
      }, 2500);
    },
  });

  if (!movie) return null;

  return (
    <Dialog open={!!movie} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl bg-[#090a0f] border-[#1e2230] text-gray-100 p-0 overflow-hidden rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Top Hero Banner with Atmospheric Backdrop */}
        <div className="relative w-full h-48 md:h-64 overflow-hidden bg-[#0c0e15]">
          {movie.backdrop_url && (
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-[1px] opacity-40 scale-105"
              style={{ backgroundImage: `url(${movie.backdrop_url})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-transparent to-[#090a0f]" />

          {/* Breadcrumbs matching screenshot 2 */}
          <div className="relative z-10 px-6 pt-5 flex items-center gap-2 text-xs font-semibold text-gray-400">
            <span className="hover:text-white cursor-pointer" onClick={onClose}>
              Home
            </span>
            <span>›</span>
            <span className="hover:text-white cursor-pointer">Movies</span>
            <span>›</span>
            <span className="text-[#e50914] truncate max-w-xs">{movie.clean_title || movie.title}</span>
          </div>
        </div>

        {/* Content Layout: Left Poster + Center Info + Right Sidebar (matching screenshot 2) */}
        <div className="relative px-6 pb-8 -mt-24 md:-mt-32 z-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            {/* Left Column: Big Poster */}
            <div className="md:col-span-4 lg:col-span-3">
              <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shadow-black/80 border-2 border-[#202538] group bg-[#11131a]">
                <img
                  src={
                    movie.poster_url ||
                    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80"
                  }
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
                {movie.match_score && (
                  <div className="absolute top-2.5 right-2.5 bg-[#e50914] text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-lg">
                    <Sparkles className="h-3 w-3 mr-1 inline" />
                    {Math.min(100, Math.round((movie.match_score / 5) * 100))}% Match
                  </div>
                )}
              </div>
            </div>

            {/* Center Column: Main Title, Badges, Buttons, Synopsis */}
            <div className="md:col-span-8 lg:col-span-6 flex flex-col justify-start">
              <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-snug mb-3">
                {movie.clean_title || movie.title}
              </h2>

              {/* Metadata Badges row matching screenshot 2 */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#1e2230] text-gray-300 border border-[#2a3045]">
                  PG-13
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#e50914]/20 text-[#ff4b55] border border-[#e50914]/40">
                  HD
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#1e2230] text-gray-300 border border-[#2a3045]">
                  {movie.runtime || 120}m
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400" />
                  {movie.vote_average ? movie.vote_average.toFixed(1) : movie.score?.toFixed(1) || "4.5"}
                </span>
                <span className="text-xs font-medium text-gray-400">
                  {movie.vote_count ? `${(movie.vote_count / 1000).toFixed(1)}k ratings` : "1.2k ratings"}
                </span>
              </div>

              {/* Action Buttons matching screenshot 2: Watch Now (Red Pill) + Rate (White Pill) */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <Button className="bg-[#e50914] hover:bg-[#ff2430] text-white font-extrabold h-10 px-6 rounded-full shadow-lg shadow-[#e50914]/35 gap-2 text-xs">
                  <Play className="h-4 w-4 fill-white" /> Watch Now
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setIsRatingOpen(!isRatingOpen)}
                  className="border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold h-10 px-5 rounded-full text-xs"
                >
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 mr-1.5" />
                  {isRatingOpen ? "Close Rating" : "★ Rate Movie"}
                </Button>
              </div>

              {/* Interactive Rating Dropdown */}
              {isRatingOpen && (
                <div className="mb-5 p-4 rounded-xl bg-[#121520] border border-[#252a3d] animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-gray-200">Select rating:</span>
                    <select
                      value={selectedRating}
                      onChange={(e) => setSelectedRating(Number(e.target.value))}
                      className="bg-[#1b1f2e] text-xs font-bold text-amber-400 py-1 px-3 rounded-lg border border-[#2e344d] focus:outline-none"
                    >
                      {[5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5].map((val) => (
                        <option key={val} value={val}>
                          ★ {val.toFixed(1)} Stars
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      onClick={() => ratingMutation.mutate()}
                      disabled={ratingMutation.isPending || ratedSuccess}
                      className={`text-xs font-bold h-8 px-4 rounded-lg ${
                        ratedSuccess ? "bg-emerald-600 hover:bg-emerald-600" : "bg-[#e50914] hover:bg-[#ff2430]"
                      }`}
                    >
                      {ratedSuccess ? <Check className="h-3.5 w-3.5 mr-1" /> : "Submit"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Synopsis */}
              <div className="mb-5">
                <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                  {movie.overview ||
                    `${movie.clean_title || movie.title} is an acclaimed cinematic work in our MovieLens collection.`}
                </p>
              </div>

              {/* ML Explanation Card */}
              {movie.explanation && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Why you see this:</strong> {movie.explanation}
                  </span>
                </div>
              )}

              {/* Share Pills matching screenshot 2 */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1a1e2c]">
                <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 mr-1">
                  <Share2 className="h-3 w-3" /> Share:
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0088cc]/20 text-[#0088cc] border border-[#0088cc]/30 cursor-pointer hover:opacity-80">
                  Telegram
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ff4500]/20 text-[#ff4500] border border-[#ff4500]/30 cursor-pointer hover:opacity-80">
                  Reddit
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1da1f2]/20 text-[#1da1f2] border border-[#1da1f2]/30 cursor-pointer hover:opacity-80">
                  Twitter
                </span>
              </div>
            </div>

            {/* Right Sidebar Column: Specifications matching screenshot 2 */}
            <div className="md:col-span-12 lg:col-span-3 bg-[#0e1017] p-4 rounded-xl border border-[#1e2230] text-xs space-y-3">
              <div>
                <span className="text-gray-400 font-medium">Premiered:</span>
                <p className="text-gray-200 font-bold mt-0.5">{movie.release_year || "Unknown"}</p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Duration:</span>
                <p className="text-gray-200 font-bold mt-0.5">{movie.runtime || 118} min</p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">IMDb Rating:</span>
                <p className="text-amber-400 font-bold mt-0.5">
                  ★ {movie.vote_average ? movie.vote_average.toFixed(1) : movie.score?.toFixed(1) || "4.5"} / 5.0
                </p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Genres:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {movie.genres_list?.map((g) => (
                    <span
                      key={g}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1a1e2c] text-gray-300 border border-[#2a3045]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#1e2230]">
                <span className="text-gray-400 font-medium">ML Recommender:</span>
                <p className="text-[#e50914] font-bold mt-0.5">SVD Matrix Factorization</p>
                <p className="text-[10px] text-gray-400 mt-0.5">20-Dimensional Latent Factors</p>
              </div>
            </div>
          </div>

          {/* Bottom Section: Similar Movies Carousel matching screenshot 2 */}
          <div className="mt-8 pt-6 border-t border-[#1e2230]">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Film className="h-4 w-4 text-[#e50914]" />
              Similar Movies (Co-Rated Latent Neighbors)
            </h3>

            {isLoadingSimilar ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-44 rounded-xl bg-[#12141d] animate-pulse" />
                ))}
              </div>
            ) : similarData?.similar_movies?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {similarData.similar_movies.slice(0, 6).map((sim) => (
                  <div
                    key={sim.movie_id}
                    onClick={() => onSelectSimilar(sim)}
                    className="group relative cursor-pointer rounded-xl overflow-hidden bg-[#11131a] border border-[#202538] hover:border-[#e50914] transition-all hover:-translate-y-1.5"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-[#151824]">
                      <img
                        src={
                          sim.poster_url ||
                          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80"
                        }
                        alt={sim.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      {sim.similarity_score && (
                        <div className="absolute top-1.5 right-1.5 bg-[#e50914] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                          {Math.round(sim.similarity_score * 100)}%
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-[#0e1017]">
                      <p className="font-bold text-xs text-gray-200 line-clamp-1 group-hover:text-[#ff4b55]">
                        {sim.clean_title || sim.title}
                      </p>
                      <span className="text-[10px] text-gray-400">{sim.release_year || "Film"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No similar movies found.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
