import { motion } from 'framer-motion';

export function AnimeDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F0F1A]">
      {/* Hero Banner Skeleton */}
      <div className="relative h-[400px] sm:h-[500px] lg:h-[600px]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02] animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A] via-[#0F0F1A]/80 to-transparent" />
        
        {/* Content Skeleton */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            {/* Poster Skeleton */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-40 sm:w-48 lg:w-56 aspect-[3/4] rounded-2xl bg-white/10 animate-pulse"
            />
            
            {/* Info Skeleton */}
            <div className="flex-1 w-full max-w-2xl">
              {/* Title */}
              <div className="h-8 sm:h-10 lg:h-12 bg-white/10 rounded-lg w-3/4 animate-pulse mb-3" />
              <div className="h-4 sm:h-5 bg-white/5 rounded w-1/2 animate-pulse mb-6" />
              
              {/* Meta Pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 w-20 bg-white/10 rounded-full animate-pulse" />
                ))}
              </div>
              
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <div className="h-12 w-40 bg-white/10 rounded-xl animate-pulse" />
                <div className="h-12 w-12 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-12 w-12 bg-white/5 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-24 bg-white/10 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Episode Stats Bar Skeleton */}
        <div className="h-24 bg-white/5 rounded-2xl animate-pulse mb-6" />

        {/* Episode Filter Skeleton */}
        <div className="flex gap-2 mb-6 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-28 bg-white/10 rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>

        {/* Episode Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <EpisodeCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EpisodeCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10">
      {/* Thumbnail Skeleton */}
      <div className="aspect-video bg-white/10 animate-pulse" />
      
      {/* Info Skeleton */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse mb-2" />
            <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
          </div>
          <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse" />
        </div>
        
        {/* Tags Skeleton */}
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-white/10 rounded-full animate-pulse" />
          <div className="h-5 w-20 bg-white/10 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function CharacterSectionSkeleton() {
  return (
    <section className="mt-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
          <div>
            <div className="h-5 w-48 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Character Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <CharacterCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

function CharacterCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
      {/* Avatar Skeleton */}
      <div className="relative flex-shrink-0">
        <div className="w-16 h-16 rounded-xl bg-white/10 animate-pulse" />
        <div className="absolute -bottom-1 -right-1 w-6 h-4 bg-white/10 rounded animate-pulse" />
      </div>
      
      {/* Info Skeleton */}
      <div className="flex-1 min-w-0">
        <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse mb-2" />
        <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse mb-2" />
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-white/5 rounded animate-pulse" />
          <div className="h-3 bg-white/10 rounded w-20 animate-pulse" />
        </div>
      </div>
      
      {/* VA Avatar Skeleton */}
      <div className="hidden sm:block w-10 h-10 rounded-lg bg-white/10 animate-pulse" />
    </div>
  );
}

export function RelatedAnimeSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
          {/* Poster Skeleton */}
          <div className="aspect-[2/3] bg-white/10 animate-pulse" />
          
          {/* Title Skeleton */}
          <div className="p-2">
            <div className="h-3 bg-white/10 rounded w-full animate-pulse mb-2" />
            <div className="h-3 bg-white/5 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Comment Input Skeleton */}
      <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
      
      {/* Comment Items */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
          
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="h-4 bg-white/10 rounded w-full animate-pulse mb-2" />
            <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
