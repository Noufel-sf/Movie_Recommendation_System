"use client";

import { Film, User, Search, Sparkles, Send, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const testUsers = [
    { id: 15, label: "User #15 (Action & Sequels Lover)" },
    { id: 1, label: "User #1 (Classic Film Buff)" },
    { id: 414, label: "User #414 (High-Volume Reviewer)" },
    { id: 999, label: "New User #999 (Cold-Start Profile)" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#090a0f]/90 border-b border-[#1b1e2c] px-4 md:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[#e50914] flex items-center justify-center shadow-lg shadow-[#e50914]/30">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-xl tracking-wider text-white">CINEMATCH</span>
              <span className="text-[10px] font-bold text-[#e50914] tracking-widest uppercase">AI</span>
            </div>
          </div>
        </div>

        {/* Search Bar with integrated Filter button (matching reference design) */}
        <div className="relative w-full md:w-[420px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search movies, actors, directors..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-20 bg-[#12141d] border-[#222638] text-sm text-gray-200 placeholder:text-gray-500 focus-visible:ring-[#e50914] focus-visible:border-[#e50914] h-10 rounded-lg"
          />
          <button
            onClick={onFilterClick}
            type="button"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#1b1f2e] hover:bg-[#252a3d] text-gray-300 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-md border border-[#2a3045] flex items-center gap-1 transition-colors"
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filter
          </button>
        </div>

        {/* Right Actions: Persona Switcher & Social */}
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

          {/* Social Quick Button */}
          <a
            href="https://github.com/Noufel-sf/Movie_Recommendation_System"
            target="_blank"
            rel="noreferrer"
            className="h-9 w-9 rounded-lg bg-[#12141d] hover:bg-[#1e2230] border border-[#222638] flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            title="GitHub Repository"
          >
            <Send className="h-4 w-4 text-[#e50914]" />
          </a>

          {/* Active Model Indicator */}
          <Button
            size="sm"
            className="bg-[#e50914] hover:bg-[#ff2430] text-white font-bold text-xs h-9 px-4 rounded-lg shadow-md shadow-[#e50914]/25 gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>ML Live</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
