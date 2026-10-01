'use client';

import { MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  return <MotionConfig reducedMotion="user"><motion.div key={pathname} className="page-scene" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .24 }}>{children}</motion.div></MotionConfig>;
}
