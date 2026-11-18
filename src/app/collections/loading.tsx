import React from 'react';

export default function CollectionsLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="h-16 border-b border-zinc-200 bg-white" />
      
      {/* Main Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-zinc-100 rounded animate-pulse" />

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="w-full aspect-[3/4] bg-zinc-100 rounded-lg animate-pulse" />
              <div className="h-4 w-3/4 bg-zinc-200 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-zinc-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
