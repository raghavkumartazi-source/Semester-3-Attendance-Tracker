'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDaysIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function AppHeader() {
  const pathname = usePathname();
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="app-brand" aria-label="Semester tracker home">
          <span className="brand-monogram" aria-hidden="true">s.</span>
          <span>semester<span className="brand-number">/03</span></span>
        </Link>
        <div className="header-actions">
          <Link href="/schedule" className={`header-action${pathname === '/schedule' ? ' is-active' : ''}`} aria-label="Weekly schedule" aria-current={pathname === '/schedule' ? 'page' : undefined} title="Weekly schedule">
            <CalendarDaysIcon aria-hidden="true" />
          </Link>
          <Link href="/settings" className={`header-action${pathname === '/settings' ? ' is-active' : ''}`} aria-label="Settings" aria-current={pathname === '/settings' ? 'page' : undefined} title="Settings">
            <Cog6ToothIcon aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
