'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/subjects', label: 'Subjects', icon: BookIcon },
  { href: '/tasks', label: 'Tasks', icon: TaskIcon },
  { href: '/schedule', label: 'Schedule', icon: CalendarIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  const activeIndex = NAV_ITEMS.findIndex(item => 
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  );
  
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <nav 
      className="fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-[480px] glass-floating rounded-[28px]"
      style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between p-2 relative z-10">
        {/* Animated active pill */}
        {activeIndex >= 0 && (
          <div 
            className="absolute top-2 bottom-2 w-1/5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `translateX(${safeActiveIndex * 100}%)` }}
          >
            <div className="w-full h-full px-1.5">
              <div className="w-full h-full glass-control-active rounded-[22px] shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
            </div>
          </div>
        )}

        {NAV_ITEMS.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-[58px] gap-1 transition-all duration-300 ease-out active:scale-90 rounded-[22px] relative z-10 ${
                isActive 
                  ? 'text-white drop-shadow-md' 
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
              }`}
            >
              <item.icon active={isActive} />
              <span className={`text-[9px] font-bold tracking-widest uppercase transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 hidden sm:block sm:opacity-50'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" stroke={active ? "#07080b" : "currentColor"} />
    </svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" stroke={active ? "#07080b" : "currentColor"} strokeWidth={active ? 3 : 1.8} />
      <line x1="8" y1="2" x2="8" y2="6" stroke={active ? "#07080b" : "currentColor"} strokeWidth={active ? 3 : 1.8} />
      <line x1="3" y1="10" x2="21" y2="10" stroke={active ? "#07080b" : "currentColor"} />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function TaskIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}
