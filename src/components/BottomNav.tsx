'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  HomeIcon, 
  BookOpenIcon, 
  Cog6ToothIcon,
  CalendarDaysIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid';

const navItems = [
  { name: 'Home', href: '/', icon: HomeIcon, iconActive: HomeIconSolid },
  { name: 'Subjects', href: '/subjects', icon: BookOpenIcon, iconActive: BookOpenIconSolid },
  { name: 'Tasks', href: '/tasks', icon: CheckCircleIcon, iconActive: CheckCircleIconSolid },
  { name: 'Schedule', href: '/schedule', icon: CalendarDaysIcon, iconActive: CalendarDaysIconSolid },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, iconActive: Cog6ToothIconSolid },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-gradient-to-t from-[#07080b] via-[#07080b]/90 to-transparent pointer-events-none">
      <div className="max-w-md mx-auto relative pointer-events-auto">
        <div className="glass-floating mx-2 rounded-[2rem] px-2 py-2 flex items-center justify-between shadow-2xl relative overflow-hidden border-t border-white/20">
          
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-indigo-500/5 to-purple-500/5 pointer-events-none" />

          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = isActive ? item.iconActive : item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all duration-300 z-10 ${
                  isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <motion.div whileTap={{ scale: 0.85 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="flex flex-col items-center">
                  <Icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : ''}`} />
                  
                  {isActive && (
                    <motion.div layoutId="nav-indicator" className="absolute -bottom-2 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_white]" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
