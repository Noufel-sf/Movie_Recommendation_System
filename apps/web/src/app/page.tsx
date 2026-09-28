"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Trophy, Layers, Zap, Flame, Compass } from "lucide-react";
import { Movie } from "@/types";
import {
  fetchMovies,
  fetchTrending,
  fetchSpotlights,
  fetchRecommendations,
  fetchGenres,
} from "@/lib/api";

import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import TrendingNumberedCarousel from "@/components/TrendingNumberedCarousel";
import MovieCarousel from "@/components/MovieCarousel";
import MovieCard from "@/components/MovieCard";
import MovieCardSkeleton from "@/components/MovieCardSkeleton";
import OnboardingModal from "@/components/OnboardingModal";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [currentUserId, setCurrentUserId] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [activeModel, setActiveModel] = useState<"hybrid" | "svd" | "content" | "popularity">("hybrid");
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // 1. Fetch Spotlights for Hero Banner
  const { data: spotlightData } = useQuery({
    queryKey: ["spotlights"],
    queryFn: () => fetchSpotlights(),
  });

  // 2. Fetch Recommendations for Active Persona & Selected Model
  const { data: recData, isLoading: isLoadingRecs } = useQuery({
    queryKey: ["recommendations", currentUserId, activeModel],
    queryFn: () => fetchRecommendations(currentUserId, 15, activeModel),
  });

  // 3. Fetch Trending Movies
  const { data: trendingData, isLoading: isLoadingTrending } = useQuery({
    queryKey: ["trending"],
    queryFn: () => fetchTrending(),
  });

  // 4. Fetch Genres
  const { data: genreData } = useQuery({
    queryKey: ["genres"],
    queryFn: () => fetchGenres(),
  });

  // 5. Fetch Paginated Catalog / Search
  const { data: catalogData, isLoading: isLoadingCatalog } = useQuery({
    queryKey: ["catalog", selectedGenre, searchQuery],
    queryFn: () => fetchMovies(1, 24, selectedGenre, searchQuery),
  });

  const spotlights = spotlightData?.spotlights || [];
  const recommendations = recData?.recommendations || [];
  const trending = trendingData?.trending || [];
  const genres = ["All", ...(genreData?.genres || [])];
  const catalogMovies = catalogData?.items || [];

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col selection:bg-[#e50914] selection:text-white relative">
      {/* Top Navbar with Instant Autocomplete & Persona Selector */}
      <Navbar
        currentUserId={currentUserId}
        onUserChange={(newId) => {
          setCurrentUserId(newId);
          if (newId === 999) {
            setIsOnboardingOpen(true);
          }
        }}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterClick={() => {
          const el = document.getElementById("catalog-explorer");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Cold-Start Persona Banner for User #999 */}
      {currentUserId === 999 && (
        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#e50914]/25 via-[#181c2b] to-black/70 border border-[#e50914]/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#e50914] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#e50914]/40">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Cold-Start Persona Active (User #999)</span>
                  <span className="text-[10px] bg-[#e50914]/30 text-white font-mono px-2 py-0.5 rounded-full border border-[#e50914]/40">
                    Phase 8 Live
                  </span>
                </h4>
                <p className="text-xs text-gray-300">
                  This user has 0 historical ratings in MovieLens. Complete the survey to synthesize your taste centroid vector in real time.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsOnboardingOpen(true)}
              className="cursor-pointer bg-[#e50914] hover:bg-[#ff1e2b] text-white font-bold text-xs h-10 px-6 rounded-full shrink-0 shadow-lg shadow-[#e50914]/30 transition-transform active:scale-95"
            >
              🎯 Take Taste Survey
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {/* If searching, display search results directly */}
        {searchQuery.trim() ? (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Search Results for <span className="text-[#e50914]">"{searchQuery}"</span>
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Found {catalogData?.total || 0} matching titles in the MovieLens catalog
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {isLoadingCatalog
                ? Array.from({ length: 12 }).map((_, i) => (
                    <MovieCardSkeleton key={i} className="w-full" />
                  ))
                : catalogMovies.map((movie) => (
                    <MovieCard key={movie.movie_id} movie={movie} className="w-full" />
                  ))}
            </div>
          </div>
        ) : (
          <>
            {/* 1. Cinematic Centered Hero Spotlight Banner */}
            <HeroBanner spotlights={spotlights.length ? spotlights : recommendations.slice(0, 8)} />

            {/* 2. Top 10 Trending Live Carousel */}
            <TrendingNumberedCarousel movies={trending} />

            <div className="max-w-[1440px] mx-auto">
              {/* 3. Top Picks For You with Interactive Model Switcher Tabs */}
              <MovieCarousel
                title={
                  currentUserId === 999
                    ? "Personalized Cold-Start Recommendations for User #999"
                    : `Top Recommendations for User #${currentUserId}`
                }
                subtitle="Live personalized ranking engine comparing algorithmic paradigms"
                icon={<Sparkles className="h-5 w-5" />}
                movies={recommendations}
                isLoading={isLoadingRecs}
                headerAction={
                  <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => setActiveModel("hybrid")}
                      className={`cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                        activeModel === "hybrid"
                          ? "bg-[#e50914] text-white shadow-lg shadow-[#e50914]/40"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Zap className="h-3 w-3" />
                      <span>Hybrid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModel("svd")}
                      className={`cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                        activeModel === "svd"
                          ? "bg-[#e50914] text-white shadow-lg shadow-[#e50914]/40"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>SVD Latent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModel("content")}
                      className={`cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                        activeModel === "content"
                          ? "bg-[#e50914] text-white shadow-lg shadow-[#e50914]/40"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Compass className="h-3 w-3" />
                      <span>Content TF-IDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModel("popularity")}
                      className={`cursor-pointer text-[11px] font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                        activeModel === "popularity"
                          ? "bg-[#e50914] text-white shadow-lg shadow-[#e50914]/40"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Trophy className="h-3 w-3" />
                      <span>Bayesian IMDB</span>
                    </button>
                  </div>
                }
              />

              {/* 4. Critically Acclaimed Hits */}
              <MovieCarousel
                title="Critically Acclaimed Hits"
                subtitle="Top rated classics with high vote density computed via Bayesian shrinkage"
                icon={<Trophy className="h-5 w-5" />}
                movies={trending.slice().reverse()}
                isLoading={isLoadingTrending}
              />

              {/* 5. Genre Catalog Explorer */}
              <section id="catalog-explorer" className="mt-14 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="h-7 w-7 rounded-lg bg-[#e50914]/20 border border-[#e50914]/30 flex items-center justify-center">
                    <Layers className="h-4 w-4 text-[#e50914]" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Explore Catalog by Genre
                    </h3>
                    <p className="text-xs text-gray-400">Filter over 9,000 titles by cinematic category</p>
                  </div>
                </div>

                {/* Genre Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
                  {genres.map((g) => (
                    <Button
                      key={g}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGenre(g)}
                      className={`cursor-pointer rounded-full text-xs font-semibold px-4 py-1.5 transition-all ${
                        selectedGenre === g
                          ? "bg-[#e50914] text-white border-[#e50914] shadow-lg shadow-[#e50914]/30 hover:bg-[#ff1e2b]"
                          : "bg-white/5 text-gray-300 border-white/10 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {g}
                    </Button>
                  ))}
                </div>

                {/* Catalog Grid with Skeletons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {isLoadingCatalog
                    ? Array.from({ length: 12 }).map((_, i) => (
                        <MovieCardSkeleton key={i} className="w-full" />
                      ))
                    : catalogMovies.map((movie) => (
                        <MovieCard key={movie.movie_id} movie={movie} className="w-full" />
                      ))}
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {/* Onboarding Modal for Cold-Start User #999 */}
      <OnboardingModal
        userId={999}
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
}
