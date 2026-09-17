'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  HomeIcon, 
  BookOpenIcon, 
  Cog6ToothIcon,
  ChartBarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  AcademicCapIcon as AcademicCapIconSolid
} from '@heroicons/react/24/solid';

const navItems = [
  { name: 'Home', href: '/', icon: HomeIcon, iconActive: HomeIconSolid, color: 'emerald' },
  { name: 'Subjects', href: '/subjects', icon: BookOpenIcon, iconActive: BookOpenIconSolid, color: 'blue' },
  { name: 'Marks', href: '/marks', icon: ChartBarIcon, iconActive: ChartBarIconSolid, color: 'amber' },
  { name: 'Planner', href: '/planner', icon: AcademicCapIcon, iconActive: AcademicCapIconSolid, color: 'indigo' },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, iconActive: Cog6ToothIconSolid, color: 'zinc' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe pt-2 bg-gradient-to-t from-[#040406] via-[#040406]/90 to-transparent pointer-events-none">
      <div className="max-w-md mx-auto relative pointer-events-auto">
        <div className="glass-floating mx-2 rounded-[2rem] px-2 py-2 flex items-center justify-between shadow-2xl relative overflow-hidden border-t border-white/20">
          
          <div className="absolute inset-0 bg-white/5 pointer-events-none" />

          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = isActive ? item.iconActive : item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl z-10 transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {/* Animated sliding pill (shared layout) */}
                {isActive && (
                  <motion.div
                    layoutId="navActivePill"
                    className="absolute inset-0 rounded-2xl bg-white/10"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.7 }}
                  />
                )}
                <motion.div
                  className="flex flex-col items-center gap-1 relative z-10"
                  animate={isActive ? { y: -1 } : { y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-md' : ''}`} />
                  
                  <span className={`text-[9px] font-bold tracking-wider uppercase transition-all duration-200 ${
                    isActive ? 'opacity-100 text-white' : 'opacity-0 h-0 hidden'
                  }`}>
                    {item.name}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
