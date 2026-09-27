"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Film, User, Search, Sparkles, Send, SlidersHorizontal, Heart, Star, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchMovies } from "@/lib/api";
import { Movie } from "@/types";

interface NavbarProps {
  currentUserId: number;
  onUserChange: (userId: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterClick?: () => void;
}

export default function Navbar({
  currentUserId,
  onUserChange,
  searchQuery,
  onSearchChange,
  onFilterClick,
}: NavbarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState<number>(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const testUsers = [
    { id: 15, label: "User #15 (Action & Sequels)" },
    { id: 1, label: "User #1 (Classic Film Buff)" },
    { id: 414, label: "User #414 (High-Volume Critic)" },
    { id: 999, label: "User #999 (Cold-Start Profile)" },
  ];

  // Live Instant Search Autocomplete Query
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["liveSearch", searchQuery],
    queryFn: () => fetchMovies(1, 5, undefined, searchQuery),
    enabled: searchQuery.trim().length >= 2,
  });

  const previewMovies = searchResults?.items || [];

  // Close search popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#090a0f]/90 border-b border-[#1b1e2c] px-4 md:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer focus:outline-none">
            <div className="h-9 w-9 rounded-lg bg-[#e50914] flex items-center justify-center shadow-lg shadow-[#e50914]/30 group-hover:scale-105 transition-transform">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-xl tracking-wider text-white group-hover:text-gray-100 transition-colors">
                CINEMATCH
              </span>
              <span className="text-[10px] font-bold text-[#e50914] tracking-widest uppercase bg-[#e50914]/15 px-1.5 py-0.5 rounded border border-[#e50914]/30">
                AI
              </span>
            </div>
          </Link>
        </div>

        {/* Search Bar with Live Autocomplete Popover */}
        <div ref={searchContainerRef} className="relative w-full md:w-[440px]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search movies, genres, keywords..."
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-20 bg-[#12141d] border-[#222638] text-sm text-gray-200 placeholder:text-gray-500 focus-visible:ring-[#e50914] focus-visible:border-[#e50914] h-10 rounded-lg"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="cursor-pointer absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <button
              onClick={onFilterClick}
              type="button"
              className="cursor-pointer absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#1b1f2e] hover:bg-[#252a3d] text-gray-300 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-md border border-[#2a3045] flex items-center gap-1 transition-colors"
            >
              <SlidersHorizontal className="h-3 w-3" />
              Filter
            </button>
          </div>

          {/* Instant Search Autocomplete Dropdown */}
          {isSearchFocused && searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#10121a] border border-[#222638] rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-2xl">
              <div className="p-2 border-b border-white/5 flex items-center justify-between text-[11px] text-gray-400 px-3">
                <span>Quick Results</span>
                {isSearching && <span className="text-[#e50914] animate-pulse">Searching...</span>}
              </div>

              {previewMovies.length > 0 ? (
                <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                  {previewMovies.map((movie) => (
                    <Link
                      key={movie.movie_id}
                      href={`/movies/${movie.movie_id}`}
                      onClick={() => setIsSearchFocused(false)}
                      className="cursor-pointer flex items-center gap-3 p-2.5 hover:bg-[#181c2b] transition-colors group"
                    >
                      {/* Poster Thumbnail */}
                      <div className="h-12 w-8 rounded overflow-hidden bg-[#1f2438] flex-none">
                        {movie.poster_url ? (
                          <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[8px] text-gray-500">
                            N/A
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-100 group-hover:text-[#e50914] truncate transition-colors">
                          {movie.clean_title || movie.title}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                          <span>{movie.release_year || "Film"}</span>
                          <span>•</span>
                          <span className="truncate">{movie.genres_list?.slice(0, 2).join(", ") || "Cinema"}</span>
                        </div>
                      </div>

                      {/* Score */}
                      {(movie.vote_average || movie.score) && (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                          <Star className="h-3 w-3 fill-amber-400" />
                          <span>{(movie.vote_average || movie.score)?.toFixed(1)}</span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  No matching titles found. Press Enter or click Filter to explore the catalog.
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right Actions: Persona Switcher & Live ML Indicator */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Persona Switcher */}
          <div className="flex items-center gap-2 bg-[#12141d] px-2.5 py-1.5 rounded-lg border border-[#222638]">
            <User className="h-3.5 w-3.5 text-[#e50914]" />
            <select
              value={currentUserId}
              onChange={(e) => onUserChange(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-gray-200 focus:outline-none cursor-pointer"
            >
              {testUsers.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#12141d] text-gray-200">
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          {/* GitHub Repo Button */}
          <a
            href="https://github.com/Noufel-sf/Movie_Recommendation_System"
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer h-9 w-9 rounded-lg bg-[#12141d] hover:bg-[#1e2230] border border-[#222638] flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            title="GitHub Repository"
          >
            <Send className="h-4 w-4 text-[#e50914]" />
          </a>

          {/* Active Model Indicator */}
          <Button
            size="sm"
            className="cursor-pointer bg-[#e50914] hover:bg-[#ff2430] text-white font-bold text-xs h-9 px-4 rounded-lg shadow-md shadow-[#e50914]/25 gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>ML Live</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
