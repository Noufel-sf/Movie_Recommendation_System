"use client";

import { Film, User, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface NavbarProps {
  currentUserId: number;
  onUserChange: (userId: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Navbar({
  currentUserId,
  onUserChange,
  searchQuery,
  onSearchChange,
}: NavbarProps) {
  const testUsers = [
    { id: 15, label: "User #15 (Action & Sequels Lover)" },
    { id: 1, label: "User #1 (Classic Film Buff)" },
    { id: 414, label: "User #414 (High-Volume Reviewer)" },
    { id: 999, label: "New User #999 (Cold-Start Profile)" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#090a0f]/85 border-b border-[#1e2230] px-4 md:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#e50914] to-[#ff3b47] flex items-center justify-center shadow-lg shadow-[#e50914]/25">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">CineMatch</span>
                <Badge variant="destructive" className="bg-[#e50914]/20 text-[#e50914] border-[#e50914]/40 hover:bg-[#e50914]/30 text-[10px] uppercase font-bold tracking-wider py-0 px-2">
                  <Sparkles className="h-2.5 w-2.5 mr-1 inline" /> ML Hybrid
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Matrix Factorization & Content Engine</p>
            </div>
          </div>
        </div>

        {/* Search Bar with shadcn Input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search 9,700+ movies by title..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-[#11131a] border-[#252a3d] text-sm text-foreground focus-visible:ring-[#e50914] h-10 rounded-xl"
          />
        </div>

        {/* User Persona Switcher */}
        <div className="flex items-center gap-2 bg-[#11131a] p-1.5 rounded-xl border border-[#252a3d] w-full md:w-auto">
          <div className="flex items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground">
            <User className="h-3.5 w-3.5 text-[#e50914]" />
            <span className="hidden sm:inline">Active Persona:</span>
          </div>
          <select
            value={currentUserId}
            onChange={(e) => onUserChange(Number(e.target.value))}
            className="bg-[#1b1f2e] text-xs font-semibold text-gray-100 py-1.5 px-3 rounded-lg border border-[#2e344d] focus:outline-none focus:ring-1 focus:ring-[#e50914] cursor-pointer"
          >
            {testUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
