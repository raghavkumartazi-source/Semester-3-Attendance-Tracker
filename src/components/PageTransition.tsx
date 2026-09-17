'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 14, scale: 0.985, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10, scale: 0.985, filter: 'blur(6px)' }}
        transition={{ duration: 0.42, ease: EASE }}
        className="w-full"
        style={{ willChange: 'opacity, transform, filter' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
