"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Check, X, Film, Zap, Compass } from "lucide-react";
import { Movie } from "@/types";
import { fetchOnboardingCandidates, submitOnboarding } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface OnboardingModalProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function OnboardingModal({
  userId,
  isOpen,
  onClose,
  onSuccess,
}: OnboardingModalProps) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["onboardingCandidates"],
    queryFn: () => fetchOnboardingCandidates(2),
    enabled: isOpen,
  });

  const candidates = data?.candidates || [];

  const toggleMovie = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const onboardingMutation = useMutation({
    mutationFn: () => submitOnboarding(userId, selectedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations", userId] });
      if (onSuccess) onSuccess();
      onClose();
    },
  });

  if (!isOpen) return null;

  const isReady = selectedIds.length >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#11141f] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-start justify-between bg-black/40">
          <div>
            <div className="inline-flex items-center gap-2 mb-2 bg-[#e50914]/15 px-3 py-1 rounded-full border border-[#e50914]/30">
              <Sparkles className="h-3.5 w-3.5 text-[#e50914]" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                Phase 8 • Cold-Start Personalization
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Train Your AI Taste Profile
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
              You are signed in as <strong>User #{userId} (Cold-Start Profile)</strong>. Select at least <strong>3 movies</strong> you enjoy across genres. Our machine learning engine will compute your taste centroid vector in real time.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Candidate Movies Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-2xl bg-[#1a1e2e] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {candidates.map((movie) => {
                const isSelected = selectedIds.includes(movie.movie_id);
                return (
                  <button
                    key={movie.movie_id}
                    type="button"
                    onClick={() => toggleMovie(movie.movie_id)}
                    className={`cursor-pointer group relative text-left rounded-2xl overflow-hidden border transition-all duration-200 focus:outline-none flex flex-col ${
                      isSelected
                        ? "border-[#e50914] ring-2 ring-[#e50914] shadow-xl shadow-[#e50914]/30 scale-[1.02]"
                        : "border-white/10 hover:border-white/30 bg-[#141724]"
                    }`}
                  >
                    {/* Poster */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#161a29]">
                      {movie.poster_url ? (
                        <img
                          src={movie.poster_url}
                          alt={movie.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center p-3 text-center text-xs text-gray-400 font-bold bg-slate-900">
                          {movie.clean_title || movie.title}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                      {/* Genre Pill */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-gray-200 border border-white/10">
                          {movie.genres_list?.[0] || "Film"}
                        </span>
                      </div>

                      {/* Selection Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg shadow-[#e50914]/50">
                          <Check className="h-4 w-4 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="p-3 bg-[#0d0f17] flex-1 flex flex-col justify-between">
                      <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#e50914] transition-colors">
                        {movie.clean_title || movie.title}
                      </h4>
                      <div className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
                        <span>{movie.release_year || "Movie"}</span>
                        {isSelected && <span className="text-[#e50914] font-semibold text-[10px]">Selected</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                isReady
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-white/5 text-gray-400 border-white/10"
              }`}
            >
              Selected: {selectedIds.length} / 3 required
            </span>
            <span className="text-[11px] text-gray-400 hidden sm:inline">
              {isReady ? "Ready to compute profile centroid" : "Pick at least 3 movies to activate"}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              className="cursor-pointer border-white/15 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs font-semibold h-10 px-5 flex-1 sm:flex-none"
            >
              Skip
            </Button>
            <Button
              type="button"
              disabled={!isReady || onboardingMutation.isPending}
              onClick={() => onboardingMutation.mutate()}
              className={`cursor-pointer font-bold text-xs h-10 px-6 rounded-full flex items-center gap-2 transition-all flex-1 sm:flex-none ${
                isReady
                  ? "bg-[#e50914] hover:bg-[#ff1e2b] text-white shadow-xl shadow-[#e50914]/40 scale-105"
                  : "bg-white/10 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              {onboardingMutation.isPending ? "Computing Centroid..." : "Initialize AI Taste Profile"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
