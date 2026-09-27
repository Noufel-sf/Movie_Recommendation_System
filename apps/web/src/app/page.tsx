"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Trophy, Layers, Sliders } from "lucide-react";
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
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [currentUserId, setCurrentUserId] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [activeModel, setActiveModel] = useState<"svd" | "content" | "popularity">("svd");

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
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col selection:bg-[#e50914] selection:text-white">
      {/* Top Navbar with Instant Autocomplete */}
      <Navbar
        currentUserId={currentUserId}
        onUserChange={setCurrentUserId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterClick={() => {
          const el = document.getElementById("catalog-explorer");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {/* If searching, display search results directly */}
        {searchQuery.trim() ? (
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
            <h2 className="text-2xl font-bold text-white mb-2">
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
            {/* 1. Hero Spotlight Banner with Bottom Poster Strip & Trailer Modal */}
            <HeroBanner spotlights={spotlights.length ? spotlights : recommendations.slice(0, 8)} />

            {/* 2. Trending Numbered Carousel (Top 10 Live) */}
            <TrendingNumberedCarousel movies={trending} />

            <div className="max-w-7xl mx-auto">
              {/* 3. Top Picks For You with Interactive Model Switcher Tabs */}
              <MovieCarousel
                title={`Top Recommendations for User #${currentUserId}`}
                subtitle="Compare AI recommendations computed live via different algorithms"
                icon={<Sparkles className="h-5 w-5" />}
                movies={recommendations}
                isLoading={isLoadingRecs}
                headerAction={
                  <div className="flex items-center gap-1.5 bg-[#12141d] p-1 rounded-xl border border-[#222638]">
                    <button
                      type="button"
                      onClick={() => setActiveModel("svd")}
                      className={`cursor-pointer text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                        activeModel === "svd"
                          ? "bg-[#e50914] text-white shadow-md shadow-[#e50914]/30"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      ✨ SVD Latent
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModel("content")}
                      className={`cursor-pointer text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                        activeModel === "content"
                          ? "bg-[#e50914] text-white shadow-md shadow-[#e50914]/30"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      🎯 TF-IDF Content
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModel("popularity")}
                      className={`cursor-pointer text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                        activeModel === "popularity"
                          ? "bg-[#e50914] text-white shadow-md shadow-[#e50914]/30"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      🏆 Bayesian IMDB
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
              <section id="catalog-explorer" className="mt-14 px-4 md:px-8">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="h-5 w-5 text-[#e50914]" />
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    Explore Catalog by Genre
                  </h3>
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
                          ? "bg-[#e50914] text-white border-[#e50914] shadow-lg shadow-[#e50914]/30 hover:bg-[#ff2430]"
                          : "bg-[#12141d] text-gray-400 border-[#222638] hover:text-white hover:border-[#e50914]/50"
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
    </div>
  );
}
