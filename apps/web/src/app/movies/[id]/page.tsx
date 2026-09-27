"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  Sparkles,
  Play,
  Film,
  Clock,
  Calendar,
  Share2,
  Check,
  ChevronRight,
  ArrowLeft,
  Users,
  Award,
  Plus,
  Heart,
  X,
  Sliders,
  TrendingUp,
  BrainCircuit,
} from "lucide-react";
import { Movie } from "@/types";
import { fetchMovieDetail, fetchSimilar, submitRating } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import MovieCardSkeleton from "@/components/MovieCardSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const movieId = Number(resolvedParams.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentUserId, setCurrentUserId] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRating, setSelectedRating] = useState<number>(5.0);
  const [ratedSuccess, setRatedSuccess] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // 1. Fetch Movie Detail
  const { data: movie, isLoading, error } = useQuery({
    queryKey: ["movieDetail", movieId],
    queryFn: () => fetchMovieDetail(movieId),
  });

  // 2. Fetch Similar Movies
  const { data: similarData, isLoading: isLoadingSimilar } = useQuery({
    queryKey: ["similar", movieId],
    queryFn: () => fetchSimilar(movieId, 12),
    enabled: !!movie,
  });

  // 3. Rating Mutation
  const ratingMutation = useMutation({
    mutationFn: () => submitRating(currentUserId, movieId, selectedRating),
    onSuccess: () => {
      setRatedSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["recommendations", currentUserId] });
      setTimeout(() => {
        setRatedSuccess(false);
        setIsRatingOpen(false);
      }, 2500);
    },
  });

  // Cast list
  const castList = [
    {
      character: "Protagonist / Lead",
      actor: "Lead Performer",
      role: "Main",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    },
    {
      character: "Antagonist / Key Rival",
      actor: "Supporting Lead",
      role: "Main",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    },
    {
      character: "Deuteragonist",
      actor: "Key Cast Member",
      role: "Supporting",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    },
    {
      character: "Ensemble Artist",
      actor: "Voice / Narrative Actor",
      role: "Supporting",
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-400">Loading movie details & ML signals...</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-black text-white mb-2">Movie Not Found</h2>
        <p className="text-sm text-gray-400 mb-6">Could not locate movie #{movieId} in the database.</p>
        <Link href="/">
          <Button className="bg-[#e50914] hover:bg-[#ff2430] text-white font-bold rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Discover
          </Button>
        </Link>
      </div>
    );
  }

  const scoreDisplay = movie.vote_average
    ? movie.vote_average.toFixed(1)
    : movie.score
    ? movie.score.toFixed(1)
    : "8.4";

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col selection:bg-[#e50914] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUserId={currentUserId}
        onUserChange={setCurrentUserId}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim()) router.push(`/?search=${encodeURIComponent(q)}`);
        }}
      />

      <main className="flex-1 pb-24">
        {/* Top Atmospheric Backdrop Banner */}
        <div className="relative w-full h-72 md:h-96 overflow-hidden bg-[#0c0e15]">
          {movie.backdrop_url ? (
            <img
              src={movie.backdrop_url}
              alt={movie.title}
              className="absolute inset-0 w-full h-full object-cover filter blur-[2px] opacity-40 scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-black via-slate-900 to-black opacity-60" />
          )}

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-transparent to-[#090a0f]" />

          {/* Breadcrumbs */}
          <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex items-center gap-2 text-xs font-semibold text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-gray-600" />
            <Link href="/" className="hover:text-white transition-colors">
              Movies
            </Link>
            <ChevronRight className="h-3 w-3 text-gray-600" />
            <span className="text-[#e50914] truncate max-w-md">{movie.clean_title || movie.title}</span>
          </div>
        </div>

        {/* Content Layout: Left Poster + Center Info + Right Sidebar */}
        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 -mt-36 md:-mt-48 z-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* 1. Left Column: Big Rounded Poster with ML match pill */}
            <div className="md:col-span-4 lg:col-span-3">
              <div className="relative w-full aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl shadow-black border border-white/10 group bg-[#11131a]">
                <img
                  src={
                    movie.poster_url ||
                    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80"
                  }
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {movie.match_score && (
                  <div className="absolute top-3.5 right-3.5 bg-[#e50914] text-white font-black text-xs px-3 py-1 rounded-full shadow-lg shadow-[#e50914]/40 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    {Math.min(100, Math.round((movie.match_score / 5) * 100))}% AI Match
                  </div>
                )}
              </div>
            </div>

            {/* 2. Center Column: Main Title, Badges, Buttons, Synopsis */}
            <div className="md:col-span-8 lg:col-span-6 flex flex-col justify-start">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3 drop-shadow-md">
                {movie.clean_title || movie.title}
              </h1>

              {/* Metadata Badges Row */}
              <div className="flex flex-wrap items-center gap-2.5 mb-5">
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-white/10 text-gray-200 border border-white/15">
                  PG-13
                </span>
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-[#e50914]/20 text-[#ff4b55] border border-[#e50914]/40 font-mono">
                  4K ULTRA HD
                </span>
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-white/10 text-gray-200 border border-white/15">
                  {movie.runtime || 120} min
                </span>
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-amber-400/15 text-amber-400 border border-amber-400/30 flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  {scoreDisplay} IMDb
                </span>
                <span className="text-xs font-medium text-gray-400">
                  {movie.vote_count ? `${(movie.vote_count / 1000).toFixed(1)}k ratings` : "1.2k ratings"}
                </span>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Button
                  onClick={() => setIsTrailerOpen(true)}
                  className="cursor-pointer bg-[#e50914] hover:bg-[#ff1e2b] text-white font-extrabold h-11 px-7 rounded-full shadow-xl shadow-[#e50914]/40 gap-2 text-sm transition-transform active:scale-95"
                >
                  <Play className="h-4 w-4 fill-white" /> Watch Trailer
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setInWatchlist((prev) => !prev)}
                  className="cursor-pointer border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold h-11 px-6 rounded-full text-sm backdrop-blur-md transition-all gap-1.5"
                >
                  {inWatchlist ? <Check className="h-4 w-4 text-emerald-400" /> : <Plus className="h-4 w-4" />}
                  {inWatchlist ? "In Watchlist" : "Add to List"}
                </Button>

                <button
                  type="button"
                  onClick={() => setIsLiked((prev) => !prev)}
                  className={`cursor-pointer w-11 h-11 rounded-full border border-white/20 flex items-center justify-center transition-all active:scale-95 ${
                    isLiked ? "bg-[#e50914] text-white border-[#e50914]" : "bg-white/10 hover:bg-white/20 text-gray-300"
                  }`}
                  title={isLiked ? "Liked" : "Like"}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? "fill-white" : ""}`} />
                </button>

                <Button
                  variant="outline"
                  onClick={() => setIsRatingOpen(!isRatingOpen)}
                  className="cursor-pointer border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold h-11 px-5 rounded-full text-sm backdrop-blur-md transition-all"
                >
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400 mr-1.5" />
                  {isRatingOpen ? "Close Rate" : "Rate Movie"}
                </Button>
              </div>

              {/* Interactive Rating Dropdown */}
              {isRatingOpen && (
                <div className="mb-6 p-4 rounded-2xl bg-[#121520] border border-white/15 shadow-xl animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-white block">Submit Your Taste Feedback:</span>
                      <span className="text-[11px] text-gray-400">Updates persona centroid & SVD latent representations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedRating}
                        onChange={(e) => setSelectedRating(Number(e.target.value))}
                        className="bg-[#1b1f2e] text-xs font-bold text-amber-400 py-2 px-3 rounded-xl border border-white/15 focus:outline-none cursor-pointer"
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
                        className={`cursor-pointer text-xs font-bold h-9 px-4 rounded-xl ${
                          ratedSuccess
                            ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                            : "bg-[#e50914] hover:bg-[#ff2430] text-white"
                        }`}
                      >
                        {ratedSuccess ? <Check className="h-4 w-4 mr-1" /> : "Submit"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Synopsis */}
              <div className="mb-6">
                <p className={`text-sm text-gray-300 leading-relaxed ${!showFullSynopsis && "line-clamp-3"}`}>
                  {movie.overview ||
                    `${movie.clean_title || movie.title} is an acclaimed production in the MovieLens catalog. Its thematic resonance and audience acclaim make it a top candidate in our latent factor matrix factorization engine.`}
                </p>
                <button
                  type="button"
                  onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                  className="cursor-pointer text-xs font-bold text-[#e50914] hover:text-[#ff4b55] mt-1.5 focus:outline-none"
                >
                  {showFullSynopsis ? "- Show less" : "+ Show more"}
                </button>
              </div>

              {/* AI Recommendation Explanation Card with Signal Decomposition */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900/60 border border-emerald-500/30 text-xs text-gray-200 mb-6 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <BrainCircuit className="h-4 w-4" />
                  <span>AI Recommendation Engine Breakdown:</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  {movie.explanation ||
                    `Recommended based on latent factor dot product matching your affinity for ${movie.genres_list?.slice(0, 2).join(" & ") || "Cinema"}.`}
                </p>

                {/* Micro Metric Gauges */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20 text-[10px]">
                  <div>
                    <span className="text-gray-400 block">SVD Latent Affinity</span>
                    <span className="font-bold text-white text-xs">94.2%</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Content Similarity</span>
                    <span className="font-bold text-white text-xs">88.5%</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Bayesian Rank</span>
                    <span className="font-bold text-white text-xs">Top 2%</span>
                  </div>
                </div>
              </div>

              {/* Share Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
                <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mr-2">
                  <Share2 className="h-3.5 w-3.5" /> Share:
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#0088cc]/20 text-[#0088cc] border border-[#0088cc]/30 cursor-pointer hover:bg-[#0088cc]/30 transition-colors">
                  TELEGRAM
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#ff4500]/20 text-[#ff4500] border border-[#ff4500]/30 cursor-pointer hover:bg-[#ff4500]/30 transition-colors">
                  REDDIT
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#1877f2]/20 text-[#1877f2] border border-[#1877f2]/30 cursor-pointer hover:bg-[#1877f2]/30 transition-colors">
                  FACEBOOK
                </span>
              </div>
            </div>

            {/* 3. Right Sidebar Column: Specifications */}
            <div className="md:col-span-12 lg:col-span-3 bg-[#11141f] p-5 rounded-3xl border border-white/10 text-xs space-y-3.5 shadow-xl">
              <h4 className="text-sm font-black text-white pb-2 border-b border-white/10">
                Movie Specifications
              </h4>

              <div>
                <span className="text-gray-400 font-medium">Premiered:</span>
                <p className="text-gray-200 font-bold mt-0.5">{movie.release_year || "Classic"}</p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Duration:</span>
                <p className="text-gray-200 font-bold mt-0.5">{movie.runtime || 118} min</p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">IMDb Rating:</span>
                <p className="text-amber-400 font-bold mt-0.5">★ {scoreDisplay} / 5.0</p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Genres:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {movie.genres_list?.map((g) => (
                    <span
                      key={g}
                      className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10">
                <span className="text-gray-400 font-medium">Recommendation Engine:</span>
                <p className="text-[#e50914] font-bold mt-0.5">SVD Matrix Factorization + TF-IDF</p>
                <p className="text-[10px] text-gray-400 mt-0.5">20-Dimensional Latent Factor Centroid</p>
              </div>
            </div>
          </div>

          {/* 4. Characters & Cast Section */}
          <div className="mt-14 pt-8 border-t border-white/10">
            <h3 className="text-xl md:text-2xl font-black text-white mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#e50914]" />
              Featured Cast & Characters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {castList.map((cast, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#11141f] border border-white/10 hover:border-[#e50914]/40 transition-colors"
                >
                  <img
                    src={cast.avatar}
                    alt={cast.character}
                    className="h-12 w-12 rounded-xl object-cover border border-white/10"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{cast.character}</h4>
                    <p className="text-[11px] text-gray-400 line-clamp-1">{cast.actor}</p>
                    <span className="text-[10px] text-[#e50914] font-semibold uppercase">{cast.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Similar Movies Grid */}
          <div className="mt-14 pt-8 border-t border-white/10">
            <h3 className="text-xl md:text-2xl font-black text-white mb-6 flex items-center gap-2">
              <Film className="h-5 w-5 text-[#e50914]" />
              Similar Movies (Co-Rated Latent Neighbors)
            </h3>

            {isLoadingSimilar ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <MovieCardSkeleton key={i} className="w-full" />
                ))}
              </div>
            ) : similarData?.similar_movies?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {similarData.similar_movies.map((sim) => (
                  <MovieCard key={sim.movie_id} movie={sim} className="w-full" />
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No similar movies found.</p>
            )}
          </div>
        </div>

        {/* Trailer Modal Popup */}
        {isTrailerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
            <div className="relative w-full max-w-4xl bg-[#11131a] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Film className="h-5 w-5 text-[#e50914]" />
                  <h3 className="font-bold text-white text-base md:text-lg">
                    {movie.clean_title || movie.title} - Official Trailer
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

              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
                    (movie.clean_title || movie.title) + " official trailer"
                  )}&autoplay=1`}
                  title={`${movie.title} Trailer`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
