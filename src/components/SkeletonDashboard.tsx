'use client';

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`skeleton-shimmer ${className}`} />;
}

export default function SkeletonDashboard() {
  return (
    <div className="dashboard-skeleton" role="status" aria-label="Loading your dashboard">
      <span className="sr-only">Loading your dashboard</span>
      <div className="skeleton-intro" aria-hidden="true">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-8 w-60" />
        <SkeletonBlock className="skeleton-hero" />
      </div>
      <div className="skeleton-metrics" aria-hidden="true">
        {[0, 1, 2].map(index => <SkeletonBlock key={index} className="skeleton-metric" />)}
      </div>
      <div className="skeleton-home-columns" aria-hidden="true">
        <div className="skeleton-home-column">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="skeleton-week" />
          {[0, 1, 2].map(index => <SkeletonBlock key={index} className="skeleton-class" />)}
        </div>
        <div className="skeleton-home-column"><SkeletonBlock className="skeleton-snapshot" /></div>
      </div>
    </div>
  );
}
