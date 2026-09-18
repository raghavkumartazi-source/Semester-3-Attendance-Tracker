'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Home', href: '/', color: '#00ff88', emoji: '🏠' },
  { name: 'Subjects', href: '/subjects', color: '#00ffff', emoji: '📚' },
  { name: 'Marks', href: '/marks', color: '#ffaa00', emoji: '📊' },
  { name: 'Planner', href: '/planner', color: '#ff0088', emoji: '📅' },
  { name: 'Settings', href: '/settings', color: '#aa00ff', emoji: '⚙️' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe pt-2 bg-gradient-to-t from-[#050508] via-[#050508]/95 to-transparent pointer-events-none"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-md mx-auto relative pointer-events-auto">
        <div className="glass-3d mx-2 rounded-[2rem] px-2 py-2.5 flex items-center justify-between shadow-2xl relative overflow-hidden border-t border-white/20">
          
          <div className="absolute inset-0 bg-white/5 pointer-events-none" />

          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl z-10 transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                style={{ 
                  minWidth: '44px', 
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {/* Animated sliding pill (shared layout) */}
                {isActive && (
                  <motion.div
                    layoutId="navActivePill"
                    className="absolute inset-0 rounded-2xl bg-white/10"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.7 }}
                  />
                )}
                <motion.div
                  className="flex flex-col items-center gap-1 relative z-10"
                  animate={isActive ? { y: -2, scale: 1.05 } : { y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <span 
                    className={`text-2rem transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_12px_currentColor]' : ''}`}
                    style={{ 
                      filter: isActive ? 'drop-shadow(0 0 12px currentColor)' : 'none',
                      transform: isActive ? 'translateZ(20px) scale(1.2)' : 'translateZ(0)',
                      transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                      display: 'block',
                      lineHeight: 1
                    }}
                    aria-hidden="true"
                  >
                    {item.emoji}
                  </span>
                  
                  <span className={`text-[9px] font-bold tracking-wider uppercase transition-all duration-200 ${
                    isActive ? 'opacity-100 text-white' : 'opacity-0 h-0 hidden'
                  }`}>
                    {item.name}
                  </span>
                </motion.div>
                
                {/* Active indicator glow */}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                    style={{ 
                      background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                      boxShadow: `0 0 12px ${item.color}, 0 0 24px ${item.color}aa`,
                      filter: 'blur(2px)'
                    }}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    exit={{ scaleX: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}