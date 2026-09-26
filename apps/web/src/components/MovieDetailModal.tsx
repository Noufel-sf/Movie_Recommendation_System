"use client";

import { useState } from "react";
import { Star, Sparkles, X, Check, ThumbsUp, Film } from "lucide-react";
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

  // Fetch live similar movies for this specific movie
  const { data: similarData, isLoading: isLoadingSimilar } = useQuery({
    queryKey: ["similar", movie?.movie_id],
    queryFn: () => (movie ? fetchSimilar(movie.movie_id, 6) : Promise.resolve({ similar_movies: [] })),
    enabled: !!movie,
  });

  // Submit rating mutation
  const ratingMutation = useMutation({
    mutationFn: () => (movie ? submitRating(currentUserId, movie.movie_id, selectedRating) : Promise.reject()),
    onSuccess: () => {
      setRatedSuccess(true);
      // Invalidate recommendations cache so new recommendations load immediately!
      queryClient.invalidateQueries({ queryKey: ["recommendations", currentUserId] });
      setTimeout(() => setRatedSuccess(false), 3000);
    },
  });

  if (!movie) return null;

  return (
    <Dialog open={!!movie} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-[#0e1017] border-[#222638] text-gray-100 p-0 overflow-hidden rounded-2xl shadow-2xl">
        {/* Header Backdrop */}
        <div className="relative h-64 w-full bg-gradient-to-t from-[#0e1017] via-slate-900 to-indigo-950 p-6 flex flex-col justify-end">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Badges */}
          <div className="relative z-10 flex flex-wrap items-center gap-2 mb-2">
            {movie.release_year && (
              <Badge variant="outline" className="bg-black/60 border-white/20 text-gray-200">
                {movie.release_year}
              </Badge>
            )}
            {movie.genres_list?.map((g) => (
              <Badge key={g} className="bg-[#e50914]/20 border border-[#e50914]/40 text-[#ff4b55]">
                {g}
              </Badge>
            ))}
            {movie.match_score && (
              <Badge className="bg-[#e50914] text-white font-bold text-xs">
                <Sparkles className="h-3 w-3 mr-1 inline" />
                {Math.min(100, Math.round((movie.match_score / 5) * 100))}% Match Score
              </Badge>
            )}
          </div>

          <DialogHeader className="relative z-10 text-left">
            <DialogTitle className="text-2xl md:text-3xl font-black text-white drop-shadow-md">
              {movie.clean_title || movie.title}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Explanation if present */}
          {movie.explanation && (
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-sm text-emerald-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Why this was recommended:</strong> {movie.explanation}
              </span>
            </div>
          )}

          {/* Interactive Rating Widget */}
          <div className="bg-[#151722] p-4 rounded-xl border border-[#222638] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h5 className="font-semibold text-sm text-white flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                Rate this Movie (Updates Your ML Taste Profile)
              </h5>
              <p className="text-xs text-gray-400 mt-0.5">
                Submitting a rating immediately updates your Content centroid and Matrix Factorization embeddings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(Number(e.target.value))}
                className="bg-[#1e2230] text-sm text-amber-400 font-bold py-1.5 px-3 rounded-lg border border-[#2e344d] focus:outline-none"
              >
                {[5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5].map((val) => (
                  <option key={val} value={val}>
                    ★ {val.toFixed(1)} Stars
                  </option>
                ))}
              </select>

              <Button
                onClick={() => ratingMutation.mutate()}
                disabled={ratingMutation.isPending || ratedSuccess}
                className={`font-semibold text-xs px-4 h-9 rounded-lg transition-all ${
                  ratedSuccess ? "bg-emerald-600 hover:bg-emerald-600 text-white" : "bg-[#e50914] hover:bg-[#ff2430] text-white shadow-md shadow-[#e50914]/30"
                }`}
              >
                {ratedSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1" /> Rated!
                  </>
                ) : ratingMutation.isPending ? (
                  "Updating..."
                ) : (
                  "Submit Rating"
                )}
              </Button>
            </div>
          </div>

          {/* Similar Movies Section */}
          <div>
            <h5 className="font-bold text-base text-white mb-3 flex items-center gap-2">
              <Film className="h-4 w-4 text-[#e50914]" />
              Similar Movies You Might Like (Content & Latent Neighbors)
            </h5>

            {isLoadingSimilar ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-[#151722] animate-pulse" />
                ))}
              </div>
            ) : similarData?.similar_movies?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {similarData.similar_movies.map((sim) => (
                  <div
                    key={sim.movie_id}
                    onClick={() => onSelectSimilar(sim)}
                    className="p-3 rounded-xl bg-[#151722] hover:bg-[#1e2230] border border-[#222638] hover:border-[#e50914]/50 cursor-pointer transition-all"
                  >
                    <p className="font-bold text-xs text-white line-clamp-1">{sim.clean_title || sim.title}</p>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                      <span>{sim.release_year || "Film"}</span>
                      {sim.similarity_score && (
                        <span className="text-[#e50914] font-semibold">
                          {Math.round(sim.similarity_score * 100)}% Match
                        </span>
                      )}
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
