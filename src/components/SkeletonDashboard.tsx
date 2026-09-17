'use client';

import { motion, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
};

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`skeleton-shimmer ${className}`} />;
}

export default function SkeletonDashboard() {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-lg mx-auto space-y-6 pb-24"
    >
      {/* Header skeleton */}
      <motion.div variants={itemVariants}>
        <SkeletonBlock className="h-3 w-20 mb-2" />
        <SkeletonBlock className="h-8 w-48" />
        <div className="mt-4 glass-recessed p-3 rounded-2xl">
          <div className="flex justify-between mb-2">
            <SkeletonBlock className="h-2.5 w-24" />
            <SkeletonBlock className="h-2.5 w-16" />
          </div>
          <SkeletonBlock className="h-2 w-full rounded-full" />
        </div>
      </motion.div>

      {/* Glance widgets skeleton */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="glass-panel rounded-3xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-9 w-9 rounded-xl" />
              <SkeletonBlock className="h-3.5 w-20" />
            </div>
            <SkeletonBlock className="h-8 w-16" />
            <SkeletonBlock className="h-2.5 w-24" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </motion.div>

      {/* Overall stats card skeleton */}
      <motion.div variants={itemVariants} className="glass-surface rounded-[22px] p-6 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-6 w-20 rounded-full" />
          </div>
          {/* Ring skeleton */}
          <div className="relative w-20 h-20">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="38"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <SkeletonBlock className="h-5 w-10 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-between border-t border-white/[0.06] pt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 space-y-2">
              <SkeletonBlock className="h-5 w-10" />
              <SkeletonBlock className="h-2 w-14" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Today's classes skeleton */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between px-1 mb-4">
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className="h-3 w-16" />
        </div>
        {[1, 2, 3].map(i => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            className="glass-elevated rounded-[18px] px-4 py-3.5 flex items-center justify-between"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-3.5 w-16" />
                <SkeletonBlock className="h-4 w-14 rounded-full" />
              </div>
              <SkeletonBlock className="h-2.5 w-32" />
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map(j => (
                <SkeletonBlock key={j} className="h-9 w-9 rounded-[14px]" />
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Subject cards skeleton */}
      <motion.div variants={itemVariants} className="space-y-3">
        <SkeletonBlock className="h-3 w-32 mb-4 mx-1" />
        {[1, 2].map(i => (
          <motion.div key={i} variants={itemVariants} className="glass-elevated rounded-[22px] p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <SkeletonBlock className="h-2.5 w-16" />
                <SkeletonBlock className="h-4 w-36" />
              </div>
              <SkeletonBlock className="h-7 w-14 rounded-lg" />
            </div>
            <SkeletonBlock className="h-1.5 w-full rounded-full" />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
