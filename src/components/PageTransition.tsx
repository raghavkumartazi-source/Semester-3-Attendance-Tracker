'use client';

import { useEffect, useRef } from 'react';
import { MotionConfig } from 'framer-motion';
import { animate, createScope } from 'animejs';
import { usePathname } from 'next/navigation';
import './ui/navigation-motion.css';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = root.current;
    if (!scene) return;
    scene.style.removeProperty('transform');
    const scope = createScope({
      root,
      mediaQueries: { reducedMotion: '(prefers-reduced-motion: reduce)' },
    }).add(self => {
      if (self?.matches.reducedMotion) return;
      animate(scene, {
        opacity: [.7, 1],
        duration: 360,
        ease: 'out(4)',
        onComplete: () => scene.style.removeProperty('opacity'),
      });
      const headings = scene.querySelectorAll('.page-header > *');
      if (headings.length) animate(headings, {
        translateY: [12, 0],
        duration: 360,
        ease: 'out(4)',
      });
    });
    return () => scope.revert();
  }, [pathname]);

  return (
    <MotionConfig reducedMotion="user">
      <div ref={root} className="page-scene v2-page-scene">{children}</div>
    </MotionConfig>
  );
}
