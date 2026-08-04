'use client';

export default function SkeletonDashboard() {
  return (
    <div className="max-w-lg mx-auto space-y-6 pb-24">
      {/* Header skeleton */}
      <div className="animate-fade-in-up stagger-1">
        <div className="skeleton-shimmer h-3 w-20 mb-2" />
        <div className="skeleton-shimmer h-7 w-48" />
      </div>

      {/* Overall stats card skeleton */}
      <div className="animate-fade-in-up stagger-2 glass-surface rounded-[22px] p-6 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="skeleton-shimmer h-3 w-16" />
            <div className="skeleton-shimmer h-6 w-20 rounded-full" />
          </div>
          {/* Ring skeleton */}
          <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="skeleton-shimmer h-6 w-12 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-between border-t border-white/[0.06] pt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 space-y-2">
              <div className="skeleton-shimmer h-5 w-10" />
              <div className="skeleton-shimmer h-2 w-14" />
            </div>
          ))}
        </div>
      </div>

      {/* Today's classes skeleton */}
      <div className="animate-fade-in-up stagger-3 space-y-3">
        <div className="flex items-center justify-between px-1 mb-4">
          <div className="skeleton-shimmer h-3 w-28" />
          <div className="skeleton-shimmer h-3 w-16" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-elevated rounded-[18px] px-4 py-3.5 flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="skeleton-shimmer h-3.5 w-16" />
                <div className="skeleton-shimmer h-4 w-14 rounded-full" />
              </div>
              <div className="skeleton-shimmer h-2.5 w-32" />
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map(j => (
                <div key={j} className="skeleton-shimmer h-8 w-8 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Subject cards skeleton */}
      <div className="animate-fade-in-up stagger-4 space-y-3">
        <div className="skeleton-shimmer h-3 w-32 mb-4 mx-1" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-elevated rounded-[22px] p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="skeleton-shimmer h-2.5 w-16" />
                <div className="skeleton-shimmer h-4 w-36" />
              </div>
              <div className="skeleton-shimmer h-7 w-14 rounded-lg" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="skeleton-shimmer h-3 w-24" />
                <div className="skeleton-shimmer h-4 w-12 rounded-full" />
              </div>
              <div className="skeleton-shimmer h-3 w-20" />
            </div>
            <div className="skeleton-shimmer h-1 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
