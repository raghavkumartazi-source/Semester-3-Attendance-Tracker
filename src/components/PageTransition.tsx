'use client';

import { useEffect, useRef } from 'react';
import { MotionConfig } from 'framer-motion';
import { createTimeline, type Timeline } from 'animejs/timeline';
import { usePathname } from 'next/navigation';
import './ui/navigation-motion.css';

function isSafeRevealTarget(element: HTMLElement) {
  // Never establish a containing block for fixed sheets or popovers.
  return !element.closest('[role="dialog"], [aria-modal="true"], .fixed')
    && !element.querySelector('[role="dialog"], [aria-modal="true"], .fixed')
    && window.getComputedStyle(element).position !== 'fixed';
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = root.current;
    if (!scene) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;

    let timeline: Timeline | undefined;
    let observer: MutationObserver | undefined;
    let stopWaiting: ReturnType<typeof setTimeout> | undefined;

    const revealPage = () => {
      const headings = Array.from(scene.querySelectorAll<HTMLElement>('.page-header > *')).filter(isSafeRevealTarget);
      const panels = Array.from(scene.querySelectorAll<HTMLElement>('[data-page-reveal], .summary-card'))
        .filter(isSafeRevealTarget)
        .filter(element => !headings.some(heading => element.contains(heading) || heading.contains(element)))
        .filter((element, _, all) => !all.some(other => other !== element && other.contains(element)))
        .slice(0, 8);
      if (!headings.length && !panels.length) return;
      observer?.disconnect();
      clearTimeout(stopWaiting);

      // Independent visual elements move; scene and route wrappers stay still.
      timeline = createTimeline({
        defaults: { duration: 420, ease: 'out(4)' },
        onComplete: () => timeline?.revert(),
      });
      headings.forEach((heading, index) => timeline?.add(heading, {
        opacity: [.35, 1],
        translateY: [12, 0],
      }, index * 35));
      panels.forEach((panel, index) => timeline?.add(panel, {
        opacity: [.5, 1],
        translateY: [14, 0],
      }, 55 + index * 35));
    };

    const frame = requestAnimationFrame(() => {
      revealPage();
      // Providers may finish loading after the route commits.
      if (!timeline) {
        observer = new MutationObserver(revealPage);
        observer.observe(scene, { childList: true, subtree: true });
        stopWaiting = setTimeout(() => observer?.disconnect(), 1500);
      }
    });

    const finishMotion = () => {
      if (!reducedMotion.matches) return;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      clearTimeout(stopWaiting);
      timeline?.revert();
    };
    reducedMotion.addEventListener('change', finishMotion);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      clearTimeout(stopWaiting);
      timeline?.revert();
      reducedMotion.removeEventListener('change', finishMotion);
    };
  }, [pathname]);

  return (
    <MotionConfig reducedMotion="user">
      <div ref={root} className="page-scene after-hours-page-scene">{children}</div>
    </MotionConfig>
  );
}
