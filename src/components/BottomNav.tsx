'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { HomeIcon, BookOpenIcon, CheckCircleIcon, CalendarDaysIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Today', href: '/', icon: HomeIcon },
  { name: 'Attendance', href: '/subjects', icon: BookOpenIcon },
  { name: 'Tasks', href: '/tasks', icon: CheckCircleIcon },
  { name: 'Planner', href: '/planner', icon: CalendarDaysIcon },
  { name: 'Marks', href: '/marks', icon: ChartBarIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="bottom-nav-inner">
        {navItems.map(({ name, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
          return (
            <Link key={href} href={href} className={`nav-item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
              {active && <motion.span className="nav-active-surface" layoutId="active-dock-tab" transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }} />}
              <motion.span className="nav-icon" animate={{ y: active ? -2 : 0 }} whileTap={reduced ? undefined : { scale: .8 }} transition={{ type: 'spring', stiffness: 420, damping: 18 }}><Icon aria-hidden="true" /></motion.span>
              <span className="nav-label">{name}</span>
              {active && <motion.span className="nav-active-dot" initial={reduced ? false : { scale: 0 }} animate={{ scale: 1 }} />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
