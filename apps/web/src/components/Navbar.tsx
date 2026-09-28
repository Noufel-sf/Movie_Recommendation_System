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
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { fetchMovies } from "@/lib/api";
import { Movie } from "@/types";

interface NavbarProps {
  currentUserId: number;
  onUserChange: (userId: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterClick?: () => void;
  onOpenOnboarding?: () => void;
}

export default function Navbar({
  currentUserId,
  onUserChange,
  searchQuery,
  onSearchChange,
  onFilterClick,
  onOpenOnboarding,
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

  // Shared User Persona Dropdown Component
  const renderUserSwitcher = () => (
    <div ref={userMenuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsUserDropdownOpen((prev) => !prev)}
        className="cursor-pointer flex items-center gap-1.5 sm:gap-2.5 bg-[#121520] hover:bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/10 transition-all focus:outline-none"
        title="Switch test persona"
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
        <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
      </button>

      {/* User Switcher Dropdown */}
      {isUserDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#121520]/95 border border-white/15 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-white/10 mb-1">
            <div className="text-xs font-bold text-white">Active Test Persona</div>
            <div className="text-[11px] text-gray-400">
              Switch user to test collaborative & latent ML personalization:
            </div>
          </div>

          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
            {testUsers.map((u) => {
              const isSelected = u.id === currentUserId;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    onUserChange(u.id);
                    setIsUserDropdownOpen(false);
                    if (u.id === 999 && onOpenOnboarding) {
                      onOpenOnboarding();
                    }
                  }}
                  className={`cursor-pointer w-full text-left p-2 rounded-xl flex items-center gap-2.5 sm:gap-3 transition-colors ${
                    isSelected ? "bg-[#e50914]/20 border border-[#e50914]/40" : "hover:bg-white/5"
                  }`}
                >
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover ring-1 ring-white/20 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span className="truncate">{u.name}</span>
                      <span className="text-[10px] font-mono text-gray-400 ml-1">#{u.id}</span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-gray-400 truncate">
                      {u.label.split("(")[1]?.replace(")", "") || u.tag}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // Live ML Engine Indicator Badge
  const renderAiBadge = (isMobile = false) => (
    <div
      className={`inline-flex items-center gap-1.5 bg-[#e50914]/15 border border-[#e50914]/30 text-white font-bold rounded-full shadow-sm ${
        isMobile ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
      }`}
    >
      <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#e50914] animate-ping" />
      <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#e50914]" />
      <span className={`font-bold text-white ${isMobile ? "hidden xs:inline text-[10px]" : "text-[11px]"}`}>
        AI Engine
      </span>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-[#090a0f]/90 border-b border-white/10 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 transition-all duration-300">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3 md:gap-6">
        
        {/* Tier 1 on Mobile: Logo on Left, User + AI Badge on Right / Left Brand on Desktop */}
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Logo & Desktop Nav Links */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer focus:outline-none shrink-0">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-[#ff2430] to-[#b30710] flex items-center justify-center shadow-lg shadow-[#e50914]/40 group-hover:scale-105 transition-transform">
                <Film className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-lg sm:text-xl tracking-wider text-white group-hover:text-gray-200 transition-colors">
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

          {/* Mobile Right Controls: Avatar + AI Badge (inline with Logo) */}
          <div className="flex md:hidden items-center gap-2">
            {renderUserSwitcher()}
            {renderAiBadge(true)}
          </div>
        </div>

        {/* Tier 2 on Mobile (Full width Search) / Center Search Bar on Desktop */}
        <div ref={searchContainerRef} className="relative w-full md:w-[400px] lg:w-[480px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search movies, genres, actors..."
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 sm:pl-10 pr-20 sm:pr-24 bg-[#121520]/80 border-white/10 text-xs sm:text-sm text-gray-100 placeholder:text-gray-500 focus-visible:ring-[#e50914] focus-visible:border-[#e50914] h-8 sm:h-9 md:h-10 rounded-full backdrop-blur-md transition-all shadow-inner"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="cursor-pointer absolute right-14 sm:right-16 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <button
              onClick={onFilterClick}
              type="button"
              className="cursor-pointer absolute right-1 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-white/10 flex items-center gap-1 transition-all"
            >
              <SlidersHorizontal className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
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
                <div className="divide-y divide-white/5 max-h-[360px] overflow-y-auto">
                  {previewMovies.map((movie) => (
                    <Link
                      key={movie.movie_id}
                      href={`/movies/${movie.movie_id}`}
                      onClick={() => setIsSearchFocused(false)}
                      className="flex items-center gap-3 p-2.5 hover:bg-white/10 transition-colors group cursor-pointer"
                    >
                      <img
                        src={movie.poster_url || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100"}
                        alt={movie.title}
                        className="h-12 w-8 object-cover rounded shadow ring-1 ring-white/10 group-hover:scale-105 transition-transform shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-white group-hover:text-[#e50914] transition-colors truncate">
                          {movie.clean_title || movie.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                          <span>{movie.release_year || "Unknown"}</span>
                          <span>•</span>
                          <span className="truncate">{movie.genres?.split("|").slice(0, 2).join(", ")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold px-2 py-1 rounded bg-amber-400/10 border border-amber-400/20 shrink-0">
                        <Star className="h-3 w-3 fill-amber-400" />
                        <span>{movie.vote_average ? movie.vote_average.toFixed(1) : "4.0"}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  No matching titles found for &quot;{searchQuery}&quot;
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Desktop-Only Right Actions (Persona Profile Menu & ML Badge) */}
        <div className="hidden md:flex items-center gap-2.5 justify-end shrink-0">
          {renderUserSwitcher()}
          {renderAiBadge(false)}
        </div>

      </div>
    </header>
  );
}
