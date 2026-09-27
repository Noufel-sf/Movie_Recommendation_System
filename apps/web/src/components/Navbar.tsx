"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Film,
  User,
  Search,
  Sparkles,
  SlidersHorizontal,
  Star,
  X,
  Compass,
  TrendingUp,
  Bookmark,
  ChevronDown,
} from "lucide-react";
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
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const testUsers = [
    {
      id: 15,
      name: "Marcus V.",
      label: "User #15 (Action & Sci-Fi Enthusiast)",
      tag: "Action / Sci-Fi",
      ratings: "148 ratings",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    },
    {
      id: 1,
      name: "Sophia L.",
      label: "User #1 (Classic Film Buff & Drama)",
      tag: "Classic / Drama",
      ratings: "232 ratings",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    },
    {
      id: 414,
      name: "Elena R.",
      label: "User #414 (High-Volume Film Critic)",
      tag: "Global Critic",
      ratings: "960 ratings",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    },
    {
      id: 999,
      name: "Alex K.",
      label: "User #999 (New Cold-Start Profile)",
      tag: "Cold Start",
      ratings: "0 ratings",
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80",
    },
  ];

  const currentUser = testUsers.find((u) => u.id === currentUserId) || testUsers[0];

  // Live Instant Search Autocomplete Query
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["liveSearch", searchQuery],
    queryFn: () => fetchMovies(1, 5, undefined, searchQuery),
    enabled: searchQuery.trim().length >= 2,
  });

  const previewMovies = searchResults?.items || [];

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-[#090a0f]/85 border-b border-white/10 px-4 md:px-8 py-3 transition-all duration-300">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
        {/* Brand & Left Navigation Links */}
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer focus:outline-none">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#ff2430] to-[#b30710] flex items-center justify-center shadow-lg shadow-[#e50914]/40 group-hover:scale-105 transition-transform">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-xl tracking-wider text-white group-hover:text-gray-200 transition-colors">
                CINEMATCH
              </span>
              <span className="text-[9px] font-black text-[#e50914] tracking-widest uppercase bg-[#e50914]/15 px-1.5 py-0.5 rounded-full border border-[#e50914]/30">
                PRO
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1.5 ml-2">
            <Link
              href="/"
              className="text-xs font-semibold text-white bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/15 transition-all"
            >
              Discover
            </Link>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("trending-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="cursor-pointer text-xs font-medium text-gray-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 transition-all flex items-center gap-1"
            >
              <TrendingUp className="h-3.5 w-3.5 text-[#e50914]" />
              Trending
            </button>
            <button
              type="button"
              onClick={onFilterClick}
              className="cursor-pointer text-xs font-medium text-gray-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 transition-all flex items-center gap-1"
            >
              <Compass className="h-3.5 w-3.5 text-[#38bdf8]" />
              Catalog
            </button>
          </nav>
        </div>

        {/* Center Search Bar with Instant Autocomplete Popover */}
        <div ref={searchContainerRef} className="relative w-full md:w-[460px]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search movies, genres, actors..."
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-24 bg-[#121520]/80 border-white/10 text-sm text-gray-100 placeholder:text-gray-500 focus-visible:ring-[#e50914] focus-visible:border-[#e50914] h-10 rounded-full backdrop-blur-md transition-all shadow-inner"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="cursor-pointer absolute right-16 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <button
              onClick={onFilterClick}
              type="button"
              className="cursor-pointer absolute right-1.5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1 transition-all"
            >
              <SlidersHorizontal className="h-3 w-3" />
              Filter
            </button>
          </div>

          {/* Instant Search Autocomplete Dropdown */}
          {isSearchFocused && searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#121520] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2.5 border-b border-white/10 flex items-center justify-between text-[11px] text-gray-400 px-3.5 bg-black/30">
                <span className="font-semibold text-gray-300">Quick Match Suggestions</span>
                {isSearching && (
                  <span className="text-[#e50914] font-bold text-xs flex items-center gap-1 animate-pulse">
                    <Sparkles className="h-3 w-3" /> Searching...
                  </span>
                )}
              </div>

              {previewMovies.length > 0 ? (
                <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                  {previewMovies.map((movie) => (
                    <Link
                      key={movie.movie_id}
                      href={`/movies/${movie.movie_id}`}
                      onClick={() => setIsSearchFocused(false)}
                      className="cursor-pointer flex items-center gap-3 p-3 hover:bg-white/10 transition-colors group"
                    >
                      {/* Poster Thumbnail */}
                      <div className="h-12 w-8 rounded-lg overflow-hidden bg-[#1f2438] flex-none border border-white/10">
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
                          <span>{movie.release_year || "Movie"}</span>
                          <span>•</span>
                          <span className="truncate">{movie.genres_list?.slice(0, 2).join(", ") || "Cinema"}</span>
                        </div>
                      </div>

                      {/* Score */}
                      {(movie.vote_average || movie.score) && (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                          <Star className="h-3 w-3 fill-amber-400" />
                          <span>{(movie.vote_average || movie.score)?.toFixed(1)}</span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  No matching titles found in the catalog. Press Enter or explore genres below.
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right Actions: Persona Profile Menu & ML Badge */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* User Persona Profile Pill Dropdown */}
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsUserDropdownOpen((prev) => !prev)}
              className="cursor-pointer flex items-center gap-2.5 bg-[#121520] hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-all focus:outline-none"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-6 w-6 rounded-full object-cover ring-1 ring-[#e50914]"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-white leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-gray-400 leading-tight">{currentUser.tag}</div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-0.5" />
            </button>

            {/* User Switcher Dropdown */}
            {isUserDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#121520] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-2xl animate-in fade-in">
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <div className="text-xs font-bold text-white">Active Test Persona</div>
                  <div className="text-[11px] text-gray-400">
                    Switch user to test collaborative & latent ML personalization:
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {testUsers.map((u) => {
                    const isSelected = u.id === currentUserId;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          onUserChange(u.id);
                          setIsUserDropdownOpen(false);
                        }}
                        className={`cursor-pointer w-full text-left p-2 rounded-xl flex items-center gap-3 transition-colors ${
                          isSelected ? "bg-[#e50914]/20 border border-[#e50914]/40" : "hover:bg-white/5"
                        }`}
                      >
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white flex items-center justify-between">
                            <span>{u.name}</span>
                            <span className="text-[10px] font-mono text-gray-400">#{u.id}</span>
                          </div>
                          <div className="text-[11px] text-gray-400 truncate">{u.label.split("(")[1]?.replace(")", "") || u.tag}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Live ML Pulse Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#e50914]/15 border border-[#e50914]/30 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#e50914] animate-ping" />
            <Sparkles className="h-3.5 w-3.5 text-[#e50914]" />
            <span className="text-[11px] font-bold text-white">AI Engine</span>
          </div>
        </div>
      </div>
    </header>
  );
}
