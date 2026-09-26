"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Flame, Trophy, Film, Layers, Star } from "lucide-react";
import { Movie } from "@/types";
import { fetchMovies, fetchTrending, fetchRecommendations, fetchGenres } from "@/lib/api";

import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import MovieCarousel from "@/components/MovieCarousel";
import MovieDetailModal from "@/components/MovieDetailModal";
import MovieCard from "@/components/MovieCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [currentUserId, setCurrentUserId] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [activeMovie, setActiveMovie] = useState<Movie | null>(null);

  // 1. Fetch Recommendations for Active Persona
  const { data: recData, isLoading: isLoadingRecs } = useQuery({
    queryKey: ["recommendations", currentUserId],
    queryFn: () => fetchRecommendations(currentUserId, 15),
  });

  // 2. Fetch Trending Movies
  const { data: trendingData } = useQuery({
    queryKey: ["trending"],
    queryFn: () => fetchTrending(),
  });

  // 3. Fetch Genres
  const { data: genreData } = useQuery({
    queryKey: ["genres"],
    queryFn: () => fetchGenres(),
  });

  // 4. Fetch Paginated Catalog / Search
  const { data: catalogData, isLoading: isLoadingCatalog } = useQuery({
    queryKey: ["catalog", selectedGenre, searchQuery],
    queryFn: () => fetchMovies(1, 24, selectedGenre, searchQuery),
  });

  const recommendations = recData?.recommendations || [];
  const trending = trendingData?.trending || [];
  const genres = ["All", ...(genreData?.genres || [])];
  const catalogMovies = catalogData?.items || [];

  // Flagship movie for Hero Banner
  const heroMovie = recommendations[0] || trending[0] || null;

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col selection:bg-[#e50914] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUserId={currentUserId}
        onUserChange={setCurrentUserId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
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
              {catalogMovies.map((movie) => (
                <MovieCard key={movie.movie_id} movie={movie} onClick={setActiveMovie} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Hero Showcase Banner */}
            <HeroBanner movie={heroMovie} onExplore={setActiveMovie} />

            {/* Recommendation Carousel 1: Personalized Top Picks */}
            <div className="max-w-7xl mx-auto">
              <MovieCarousel
                title={`Top Recommendations for User #${currentUserId}`}
                subtitle="Ranked via Latent Factor Matrix Factorization & TF-IDF Content Centroids"
                icon={<Sparkles className="h-5 w-5" />}
                movies={recommendations}
                onMovieClick={setActiveMovie}
              />

              {/* Recommendation Carousel 2: Trending Now */}
              <MovieCarousel
                title="Trending Right Now"
                subtitle="Exponential time-decay popularity weighting recent viewer activity"
                icon={<Flame className="h-5 w-5" />}
                movies={trending}
                onMovieClick={setActiveMovie}
              />

              {/* Genre Filter Pills & Catalog Explorer */}
              <section className="mt-12 px-4 md:px-8">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="h-5 w-5 text-[#e50914]" />
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    Explore Movie Catalog
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
                      className={`rounded-full text-xs font-semibold px-4 py-1.5 transition-all ${
                        selectedGenre === g
                          ? "bg-[#e50914] text-white border-[#e50914] shadow-md shadow-[#e50914]/30 hover:bg-[#e50914]"
                          : "bg-[#11131a] text-gray-400 border-[#222638] hover:text-white hover:border-[#e50914]/40"
                      }`}
                    >
                      {g}
                    </Button>
                  ))}
                </div>

                {/* Catalog Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {catalogMovies.map((movie) => (
                    <MovieCard key={movie.movie_id} movie={movie} onClick={setActiveMovie} />
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {/* Movie Detail & Live Interactive Rating Modal */}
      <MovieDetailModal
        movie={activeMovie}
        currentUserId={currentUserId}
        onClose={() => setActiveMovie(null)}
        onSelectSimilar={setActiveMovie}
      />
    </div>
  );
}
