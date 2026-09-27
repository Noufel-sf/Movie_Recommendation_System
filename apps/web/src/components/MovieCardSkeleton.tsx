"use client";

interface MovieCardSkeletonProps {
  className?: string;
}

export default function MovieCardSkeleton({ className }: MovieCardSkeletonProps) {
  return (
    <div className={`flex flex-col gap-2 animate-pulse ${className || "w-44 md:w-52 flex-none"}`}>
      {/* Poster Skeleton */}
      <div className="aspect-[2/3] w-full rounded-2xl bg-[#151926] border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      {/* Title & Metadata Skeleton */}
      <div className="px-0.5 pt-1 space-y-2">
        <div className="h-4 bg-[#1a1f30] rounded-md w-3/4" />
        <div className="flex items-center justify-between">
          <div className="h-3 bg-[#161a29] rounded w-10" />
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-[#161a29] rounded-full" />
            <div className="h-3 w-3 bg-[#161a29] rounded-full" />
            <div className="h-3 bg-[#1a1f30] rounded w-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
