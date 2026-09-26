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
} from "lucide-react";
import { Movie } from "@/types";
import { fetchMovieDetail, fetchSimilar, submitRating } from "@/lib/api";
import Navbar from "@/components/Navbar";
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

  // 1. Fetch Movie Detail
  const { data: movie, isLoading, error } = useQuery({
    queryKey: ["movieDetail", movieId],
    queryFn: () => fetchMovieDetail(movieId),
  });

  // 2. Fetch Similar Movies
  const { data: similarData, isLoading: isLoadingSimilar } = useQuery({
    queryKey: ["similar", movieId],
    queryFn: () => fetchSimilar(movieId, 10),
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

  // Mock cast tailored to cinematic immersion (matching screenshot 2 layout)
  const castList = [
    {
      character: "Protagonist / Lead",
      actor: "Lead Performer",
      role: "Main",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    },
    {
      character: "Antagonist / Rival",
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
      character: "Director's Cut Voice",
      actor: "Ensemble Artist",
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
          <Button className="bg-[#e50914] hover:bg-[#ff2430] text-white font-bold">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Button>
        </Link>
      </div>
    );
  }

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

      {/* Main Full-Page Detail View (Matching Screenshot 2) */}
      <main className="flex-1 pb-24">
        {/* Top Atmospheric Backdrop Banner */}
        <div className="relative w-full h-64 md:h-80 overflow-hidden bg-[#0c0e15]">
          {movie.backdrop_url && (
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-[2px] opacity-35 scale-105"
              style={{ backgroundImage: `url(${movie.backdrop_url})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-transparent to-[#090a0f]" />

          {/* Breadcrumbs matching screenshot 2: Home > TV/Movies > Title */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-6 flex items-center gap-2 text-xs font-semibold text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>›</span>
            <Link href="/" className="hover:text-white transition-colors">
              Movies
            </Link>
            <span>›</span>
            <span className="text-[#e50914] truncate max-w-md">{movie.clean_title || movie.title}</span>
          </div>
        </div>

        {/* Content Layout: Left Poster + Center Info + Right Sidebar (matching screenshot 2) */}
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 -mt-32 md:-mt-40 z-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* 1. Left Column: Big Vertical Poster */}
            <div className="md:col-span-4 lg:col-span-3">
              <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black border-2 border-[#1f2436] group bg-[#11131a]">
                <img
                  src={
                    movie.poster_url ||
                    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80"
                  }
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {movie.match_score && (
                  <div className="absolute top-3 right-3 bg-[#e50914] text-white font-black text-xs px-3 py-1 rounded-full shadow-lg shadow-[#e50914]/40 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    {Math.min(100, Math.round((movie.match_score / 5) * 100))}% Match
                  </div>
                )}
              </div>
            </div>

            {/* 2. Center Column: Main Title, Badges, Buttons, Synopsis */}
            <div className="md:col-span-8 lg:col-span-6 flex flex-col justify-start">
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3 drop-shadow-md">
                {movie.clean_title || movie.title}
              </h1>

              {/* Metadata Badges row matching screenshot 2: [R] [TV/MOVIE] [E 23 / HD] [23M] [478.9K] */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#1e2230] text-gray-300 border border-[#2a3045]">
                  PG-13
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#e50914]/20 text-[#ff4b55] border border-[#e50914]/40 font-mono">
                  HD
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#1e2230] text-gray-300 border border-[#2a3045]">
                  {movie.runtime || 120}m
                </span>
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  {movie.vote_average ? movie.vote_average.toFixed(1) : movie.score?.toFixed(1) || "4.5"} IMDB
                </span>
                <span className="text-xs font-medium text-gray-400">
                  {movie.vote_count ? `${(movie.vote_count / 1000).toFixed(1)}k ratings` : "1.2k ratings"}
                </span>
              </div>

              {/* Action Buttons matching screenshot 2: Watch Now (Red Pill) + Add to List / Rate (White Pill) */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Button className="bg-[#e50914] hover:bg-[#ff2430] text-white font-black h-11 px-7 rounded-full shadow-xl shadow-[#e50914]/40 gap-2 text-sm transition-transform active:scale-95">
                  <Play className="h-4 w-4 fill-white" /> Watch Now
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setIsRatingOpen(!isRatingOpen)}
                  className="border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold h-11 px-6 rounded-full text-sm backdrop-blur-md transition-all"
                >
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400 mr-1.5" />
                  {isRatingOpen ? "Close Rating" : "+ Rate Movie"}
                </Button>
              </div>

              {/* Interactive Rating Dropdown */}
              {isRatingOpen && (
                <div className="mb-6 p-4 rounded-xl bg-[#121520] border border-[#252a3d] animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-gray-200 block">Submit Your Taste Signal:</span>
                      <span className="text-[11px] text-gray-400">Updates your SVD latent profile and content vector</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedRating}
                        onChange={(e) => setSelectedRating(Number(e.target.value))}
                        className="bg-[#1b1f2e] text-xs font-bold text-amber-400 py-1.5 px-3 rounded-lg border border-[#2e344d] focus:outline-none"
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
                          ratedSuccess ? "bg-emerald-600 hover:bg-emerald-600 text-white" : "bg-[#e50914] hover:bg-[#ff2430] text-white"
                        }`}
                      >
                        {ratedSuccess ? <Check className="h-3.5 w-3.5 mr-1" /> : "Submit"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Synopsis with + Show more toggle */}
              <div className="mb-6">
                <p className={`text-sm text-gray-300 leading-relaxed ${!showFullSynopsis && "line-clamp-3"}`}>
                  {movie.overview ||
                    `${movie.clean_title || movie.title} is an acclaimed production in the MovieLens catalog. Its thematic resonance and audience acclaim make it a top candidate in our latent factor matrix factorization engine.`}
                </p>
                <button
                  type="button"
                  onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                  className="text-xs font-bold text-[#e50914] hover:text-[#ff4b55] mt-1.5 focus:outline-none"
                >
                  {showFullSynopsis ? "- Show less" : "+ Show more"}
                </button>
              </div>

              {/* ML Explanation Card */}
              {movie.explanation && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2.5 mb-6">
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Why you see this:</strong> {movie.explanation}
                  </span>
                </div>
              )}

              {/* Share Pills matching screenshot 2: Telegram, Reddit, Facebook, WhatsApp, Twitter */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#1a1e2c]">
                <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mr-2">
                  <Share2 className="h-3.5 w-3.5" /> Share This Movie:
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded bg-[#0088cc]/20 text-[#0088cc] border border-[#0088cc]/30 cursor-pointer hover:bg-[#0088cc]/30 transition-colors">
                  TELEGRAM
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded bg-[#ff4500]/20 text-[#ff4500] border border-[#ff4500]/30 cursor-pointer hover:bg-[#ff4500]/30 transition-colors">
                  REDDIT
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded bg-[#1877f2]/20 text-[#1877f2] border border-[#1877f2]/30 cursor-pointer hover:bg-[#1877f2]/30 transition-colors">
                  FACEBOOK
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded bg-[#25d366]/20 text-[#25d366] border border-[#25d366]/30 cursor-pointer hover:bg-[#25d366]/30 transition-colors">
                  WHATSAPP
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded bg-[#1da1f2]/20 text-[#1da1f2] border border-[#1da1f2]/30 cursor-pointer hover:bg-[#1da1f2]/30 transition-colors">
                  TWITTER
                </span>
              </div>
            </div>

            {/* 3. Right Sidebar Column: Specifications matching screenshot 2 */}
            <div className="md:col-span-12 lg:col-span-3 bg-[#0d1017] p-5 rounded-2xl border border-[#1f2436] text-xs space-y-3.5 shadow-xl">
              <div>
                <span className="text-gray-400 font-medium">Premiered:</span>
                <p className="text-gray-200 font-bold mt-0.5">{movie.release_year || "Classic"}</p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Season / Release:</span>
                <p className="text-gray-200 font-bold mt-0.5">Theatrical Edition</p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Rate:</span>
                <p className="text-gray-200 font-bold mt-0.5">PG-13 (thematic intensity)</p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">English:</span>
                <p className="text-gray-200 font-bold mt-0.5">{movie.clean_title || movie.title}</p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Duration:</span>
                <p className="text-gray-200 font-bold mt-0.5">{movie.runtime || 118} min</p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Score:</span>
                <p className="text-amber-400 font-bold mt-0.5">
                  ★ {movie.vote_average ? movie.vote_average.toFixed(1) : movie.score?.toFixed(1) || "4.5"} / 5.0
                </p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Genre:</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {movie.genres_list?.map((g) => (
                    <span
                      key={g}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#161a29] text-gray-300 border border-[#272e48]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1f2436]">
                <span className="text-gray-400 font-medium">ML Model Engine:</span>
                <p className="text-[#e50914] font-bold mt-0.5">Matrix Factorization (SVD)</p>
                <p className="text-[10px] text-gray-400 mt-0.5">20-Dimensional Latent Factor Dot Product</p>
              </div>
            </div>
          </div>

          {/* 4. Characters & Voice Actors / Cast Section (matching screenshot 2) */}
          <div className="mt-14 pt-8 border-t border-[#1e2230]">
            <h3 className="text-xl md:text-2xl font-black text-[#38bdf8] mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#38bdf8]" />
              Characters and Voice Actors
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {castList.map((cast, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#11131a] border border-[#202538] hover:border-[#38bdf8]/40 transition-colors"
                >
                  <img
                    src={cast.avatar}
                    alt={cast.character}
                    className="h-12 w-12 rounded-lg object-cover border border-white/10"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{cast.character}</h4>
                    <p className="text-[11px] text-gray-400 line-clamp-1">{cast.actor}</p>
                    <span className="text-[10px] text-[#38bdf8] font-semibold uppercase">{cast.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Similar Movies Carousel (Co-Rated Latent Neighbors matching screenshot 2) */}
          <div className="mt-14 pt-8 border-t border-[#1e2230]">
            <h3 className="text-xl md:text-2xl font-black text-white mb-6 flex items-center gap-2">
              <Film className="h-5 w-5 text-[#e50914]" />
              Similar Movies (Co-Rated Latent Neighbors)
            </h3>

            {isLoadingSimilar ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-56 rounded-xl bg-[#12141d] animate-pulse" />
                ))}
              </div>
            ) : similarData?.similar_movies?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {similarData.similar_movies.map((sim) => (
                  <div
                    key={sim.movie_id}
                    onClick={() => router.push(`/movies/${sim.movie_id}`)}
                    className="group relative cursor-pointer rounded-xl overflow-hidden bg-[#11131a] border border-[#202538] hover:border-[#e50914] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#e50914]/20"
                  >
                    <div className="relative h-60 w-full overflow-hidden bg-[#151824]">
                      <img
                        src={
                          sim.poster_url ||
                          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80"
                        }
                        alt={sim.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      {sim.similarity_score && (
                        <div className="absolute top-2 right-2 bg-[#e50914] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                          {Math.round(sim.similarity_score * 100)}%
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-[#0e1017]">
                      <p className="font-bold text-xs text-gray-200 line-clamp-1 group-hover:text-[#ff4b55] transition-colors">
                        {sim.clean_title || sim.title}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                        <span>{sim.release_year || "Movie"}</span>
                        <span className="text-amber-400 font-semibold">★ {sim.score?.toFixed(1) || "4.5"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No similar movies found.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
