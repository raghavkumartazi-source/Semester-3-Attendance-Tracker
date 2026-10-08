'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { animate, createScope, spring, type JSAnimation, type Scope } from 'animejs';
import { HomeIcon, BookOpenIcon, CheckCircleIcon, CalendarDaysIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import './ui/navigation-motion.css';

const navItems = [
  { name: 'Today', href: '/', icon: HomeIcon },
  { name: 'Attendance', href: '/subjects', icon: BookOpenIcon },
  { name: 'Tasks', href: '/tasks', icon: CheckCircleIcon },
  { name: 'Planner', href: '/planner', icon: CalendarDaysIcon },
  { name: 'Marks', href: '/marks', icon: ChartBarIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const activeIndex = navItems.findIndex(({ href }) => pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)));
  const root = useRef<HTMLElement>(null);
  const scope = useRef<Scope | null>(null);
  const [initialIndex] = useState(Math.max(0, activeIndex));

  useEffect(() => {
    const dock = root.current;
    if (!dock) return;
    const plate = dock.querySelector<HTMLElement>('.v2-dock-plate');
    if (plate) plate.style.transform = `translateX(${initialIndex * 100}%)`;

    const animationScope = createScope({ root }).add(self => {
      if (!self) return;
      let plateAnimation: JSAnimation | undefined;
      let lastValidIndex = initialIndex;
      self.add('move', (index: number) => {
        plateAnimation?.cancel();
        if (index < 0) {
          if (plate) plate.style.transform = `translateX(${lastValidIndex * 100}%)`;
          return;
        }
        lastValidIndex = index;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          if (plate) plate.style.transform = `translateX(${index * 100}%)`;
          return;
        }
        plateAnimation = animate('.v2-dock-plate', {
          translateX: `${index * 100}%`,
          ease: spring({ bounce: .18, duration: 480 }),
        });
      });
      self.add('press', (icon: HTMLElement) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        animate(icon, {
          scale: [{ to: .78, duration: 90 }, { to: 1, ease: spring({ bounce: .45, duration: 380 }) }],
          rotate: [{ to: -7, duration: 90 }, { to: 0, duration: 380 }],
        });
      });
    });
    scope.current = animationScope;
    return () => {
      animationScope.revert();
      scope.current = null;
    };
  }, [initialIndex]);

  useEffect(() => {
    scope.current?.methods.move(activeIndex);
  }, [activeIndex]);

  return (
    <nav ref={root} className={`v2-dock${activeIndex >= 0 ? ' has-active-tab' : ''}`} aria-label="Main navigation">
      <div className="v2-dock-inner" style={{ '--dock-index': initialIndex } as CSSProperties}>
        <span className="v2-dock-plate" aria-hidden="true" />
        {navItems.map(({ name, href, icon: Icon }, index) => (
          <Link
            key={href}
            href={href}
            className={`v2-dock-item${index === activeIndex ? ' is-current' : ''}`}
            aria-current={index === activeIndex ? 'page' : undefined}
            onPointerDown={event => {
              const icon = event.currentTarget.querySelector<HTMLElement>('.v2-dock-icon');
              if (icon) scope.current?.methods.press(icon);
            }}
          >
            <span className="v2-dock-icon"><Icon aria-hidden="true" /></span>
            <span className="v2-dock-label">{name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
