'use client';

import { ReactNode, useEffect } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

export function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const reduced = useReducedMotion();
  const count = useSpring(0, { stiffness: 65, damping: 22 });
  const display = useTransform(count, n => n.toFixed(decimals));
  useEffect(() => { if (reduced) count.jump(value); else count.set(value); }, [count, reduced, value]);
  return <><span className="sr-only">{value.toFixed(decimals)}</span><motion.span aria-hidden="true">{display}</motion.span></>;
}

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -20px 0px' }} transition={{ duration: .5, delay, ease: [.22, 1, .36, 1] }}>{children}</motion.div>;
}

export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(x, { stiffness: 180, damping: 22 });
  const rotateY = useSpring(y, { stiffness: 180, damping: 22 });
  const reset = () => { x.set(0); y.set(0); };
  return (
    <motion.div className={`tilt-card ${className}`} style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={event => {
        if (reduced || event.pointerType !== 'mouse') return;
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(-(event.clientY - rect.top - rect.height / 2) / rect.height * 7);
        y.set((event.clientX - rect.left - rect.width / 2) / rect.width * 7);
      }}
      onPointerDown={event => { if (!reduced && event.pointerType === 'touch') { x.set(2); y.set(-2); } }}
      onPointerLeave={reset} onPointerUp={reset} onPointerCancel={reset}
      whileTap={reduced ? undefined : { scale: .985 }}>
      {children}
    </motion.div>
  );
}
