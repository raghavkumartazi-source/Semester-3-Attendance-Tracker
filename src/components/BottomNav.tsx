'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { animate, type JSAnimation } from 'animejs/animation';
import { spring } from 'animejs/easings/spring';
import { HomeIcon, BookOpenIcon, CheckCircleIcon, CalendarDaysIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import './ui/navigation-motion.css';

const navItems = [
  { name: 'Today', href: '/', icon: HomeIcon },
  { name: 'Attendance', href: '/subjects', icon: BookOpenIcon },
  { name: 'Tasks', href: '/tasks', icon: CheckCircleIcon },
  { name: 'Planner', href: '/planner', icon: CalendarDaysIcon },
  { name: 'Marks', href: '/marks', icon: ChartBarIcon },
];

type DockMotion = {
  move: (index: number) => void;
  press: (icon: HTMLElement) => void;
};

export default function BottomNav() {
  const pathname = usePathname();
  const activeIndex = navItems.findIndex(({ href }) => pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)));
  const root = useRef<HTMLElement>(null);
  const motion = useRef<DockMotion | null>(null);
  const [initialIndex] = useState(() => Math.max(0, activeIndex));

  useEffect(() => {
    const dock = root.current;
    const plate = dock?.querySelector<HTMLElement>('.nav-active-surface');
    if (!dock || !plate) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const iconAnimations = new Map<HTMLElement, JSAnimation>();
    let plateAnimation: JSAnimation | undefined;
    let currentIndex = initialIndex;

    // A new spring starts from the live position when a tap interrupts it.
    const move = (index: number) => {
      plateAnimation?.cancel();
      if (index < 0) return;
      currentIndex = index;
      if (reducedMotion.matches) {
        plate.style.transform = `translateX(${index * 100}%)`;
        return;
      }
      plateAnimation = animate(plate, {
        translateX: `${index * 100}%`,
        ease: spring({ bounce: .2, duration: 480 }),
      });
    };

    const press = (icon: HTMLElement) => {
      if (reducedMotion.matches) return;
      iconAnimations.get(icon)?.cancel();
      iconAnimations.set(icon, animate(icon, {
        scale: [
          { to: .78, duration: 85, ease: 'out(3)' },
          { to: 1, ease: spring({ bounce: .42, duration: 430 }) },
        ],
        rotate: [
          { to: -6, duration: 85, ease: 'out(3)' },
          { to: 0, duration: 430, ease: 'out(4)' },
        ],
        onComplete: () => {
          icon.style.removeProperty('transform');
          iconAnimations.delete(icon);
        },
      }));
    };

    const finishMotion = () => {
      if (!reducedMotion.matches) return;
      plateAnimation?.cancel();
      plate.style.transform = `translateX(${currentIndex * 100}%)`;
      iconAnimations.forEach((animation, icon) => {
        animation.cancel();
        icon.style.removeProperty('transform');
      });
      iconAnimations.clear();
    };

    // The CSS starting position also avoids a highlight flash before hydration.
    plate.style.transform = `translateX(${currentIndex * 100}%)`;
    motion.current = { move, press };
    reducedMotion.addEventListener('change', finishMotion);
    return () => {
      plateAnimation?.cancel();
      iconAnimations.forEach((animation, icon) => {
        animation.cancel();
        icon.style.removeProperty('transform');
      });
      reducedMotion.removeEventListener('change', finishMotion);
      motion.current = null;
    };
  }, [initialIndex]);

  useEffect(() => {
    motion.current?.move(activeIndex);
  }, [activeIndex]);

  return (
    <nav ref={root} className={`bottom-nav after-hours-dock${activeIndex >= 0 ? ' has-active-tab' : ''}`} aria-label="Main navigation">
      <div className="bottom-nav-inner" style={{ '--dock-index': initialIndex } as CSSProperties}>
        <span className="nav-active-surface" aria-hidden="true"><span className="nav-active-dot" /></span>
        {navItems.map(({ name, href, icon: Icon }, index) => (
          <Link
            key={href}
            href={href}
            className={`nav-item${index === activeIndex ? ' is-active' : ''}`}
            aria-current={index === activeIndex ? 'page' : undefined}
            onPointerDown={event => {
              if (event.button !== 0) return;
              const icon = event.currentTarget.querySelector<HTMLElement>('.nav-icon-motion');
              if (icon) motion.current?.press(icon);
            }}
            onClick={event => {
              if (event.detail !== 0) return;
              const icon = event.currentTarget.querySelector<HTMLElement>('.nav-icon-motion');
              if (icon) motion.current?.press(icon);
            }}
          >
            <span className="nav-icon"><span className="nav-icon-motion"><Icon aria-hidden="true" /></span></span>
            <span className="nav-label">{name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
