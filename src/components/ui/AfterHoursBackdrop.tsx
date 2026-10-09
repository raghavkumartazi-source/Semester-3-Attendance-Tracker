'use client';

import { useEffect, useRef } from 'react';
import './after-hours-backdrop.css';

type FieldPoint = { x: number; y: number; depth: number; phase: number; pushX: number; pushY: number };
type AfterHoursBackdropProps = { className?: string };

const random = (index: number) => {
  const seed = Math.sin(index * 78.233 + 37.719) * 43758.5453;
  return seed - Math.floor(seed);
};

/**
 * A small 2D renderer of a depth field: points retain the previous ring push,
 * then settle home. This adapts the documented Originkit ring-field mechanism
 * without distributing its gated source or adding a second full-screen WebGL context.
 */
export function AfterHoursBackdrop({ className = '' }: AfterHoursBackdropProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = window.matchMedia('(pointer: coarse)');
    let width = 0;
    let height = 0;
    let points: FieldPoint[] = [];
    let frame = 0;
    let lastFrame = 0;
    let elapsed = 0;
    let visible = false;
    let pointerActive = false;
    let pointerLastMoved = 0;
    let targetX = .78;
    let targetY = .22;
    let ringX = .78;
    let ringY = .22;
    let pulse = 0;

    const resize = () => {
      const bounds = root.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(coarse.matches ? 150 : 220, Math.max(70, Math.floor(width * height / 3800)));
      points = Array.from({ length: count }, (_, index) => ({
        x: random(index * 7 + 1), y: random(index * 7 + 2),
        depth: .25 + random(index * 7 + 3) * .75,
        phase: random(index * 7 + 4) * Math.PI * 2,
        pushX: 0, pushY: 0,
      }));
      draw(0, 0);
    };

    const draw = (delta: number, time: number) => {
      if (!width || !height) return;
      const still = reduced.matches;
      context.clearRect(0, 0, width, height);
      const idle = !pointerActive || performance.now() - pointerLastMoved > 2200;
      if (idle && !still) {
        targetX = .7 + Math.sin(time * .13) * .12;
        targetY = .24 + Math.cos(time * .11) * .1;
      }
      const easing = still ? 1 : 1 - Math.exp(-5 * delta);
      ringX += (targetX - ringX) * easing;
      ringY += (targetY - ringY) * easing;
      pulse = Math.max(0, pulse - delta * .8);
      const centreX = ringX * width;
      const centreY = ringY * height;
      const radius = Math.min(width * .28, 170) + pulse * 25;
      const band = 28 + pulse * 12;

      for (const point of points) {
        const homeX = point.x * width;
        const homeY = point.y * height;
        const dx = homeX - centreX;
        const dy = homeY - centreY;
        const distance = Math.hypot(dx, dy) || 1;
        const ring = still ? 0 : Math.exp(-Math.pow((distance - radius) / band, 2));
        const memory = still ? 0 : Math.pow(.8, delta * 30);
        const force = ring * (8 + pulse * 18) * point.depth;
        point.pushX = point.pushX * memory + dx / distance * force * (1 - memory);
        point.pushY = point.pushY * memory + dy / distance * force * (1 - memory);
        const driftX = still ? 0 : Math.sin(time * .14 + point.phase) * 2.5 * point.depth;
        const driftY = still ? 0 : Math.cos(time * .12 + point.phase) * 3 * point.depth;
        const x = homeX + point.pushX + driftX;
        const y = homeY + point.pushY + driftY;
        const angle = Math.atan2(dy, dx) + Math.sin(point.phase) * .4;
        const length = .8 + point.depth * 1.5 + ring * 3.5;
        const alpha = .08 + point.depth * .09 + ring * .35;
        context.save();
        context.translate(x, y);
        context.rotate(angle);
        context.strokeStyle = ring > .12 ? `rgba(241,173,155,${alpha})` : `rgba(180,136,159,${alpha})`;
        context.lineWidth = .65 + point.depth * .75 + ring * .4;
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(-length / 2, 0);
        context.lineTo(length / 2, 0);
        context.stroke();
        if (ring > .3) {
          context.fillStyle = `rgba(242,180,158,${ring * .05})`;
          context.beginPath();
          context.ellipse(0, 0, length * 2, 2 + ring * 3, 0, 0, Math.PI * 2);
          context.fill();
        }
        context.restore();
      }
      if (!still) {
        // A barely visible band connects the illuminated points into a circular field.
        context.beginPath();
        context.strokeStyle = `rgba(237,177,161,${.018 + pulse * .06})`;
        context.lineWidth = 1;
        context.arc(centreX, centreY, radius, 0, Math.PI * 2);
        context.stroke();
      }
    };

    const tick = (now: number) => {
      if (!visible || document.hidden || reduced.matches) { frame = 0; return; }
      frame = requestAnimationFrame(tick);
      const limit = 1000 / (coarse.matches ? 24 : 30);
      if (lastFrame && now - lastFrame < limit) return;
      const delta = lastFrame ? Math.min((now - lastFrame) / 1000, .1) : 1 / 30;
      lastFrame = now;
      elapsed += delta;
      draw(delta, elapsed);
    };
    const playback = () => {
      if (visible && !document.hidden && !reduced.matches) {
        if (!frame) { lastFrame = 0; frame = requestAnimationFrame(tick); }
      } else if (frame) { cancelAnimationFrame(frame); frame = 0; }
    };
    const pointTo = (event: PointerEvent) => {
      if (reduced.matches || !visible || document.hidden) return;
      // The decoration observes passively; fields, scrolling and controls keep ownership.
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.type === 'pointermove' && event.pointerType !== 'mouse') return;
      const bounds = root.getBoundingClientRect();
      targetX = Math.max(0, Math.min(1, (event.clientX - bounds.left) / width));
      targetY = Math.max(0, Math.min(1, (event.clientY - bounds.top) / height));
      pointerLastMoved = performance.now();
      pointerActive = true;
      if (event.type === 'pointerdown') pulse = 1;
    };
    const leave = () => { pointerActive = false; };
    const motionChange = () => { playback(); if (reduced.matches) draw(0, 0); };
    const observer = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; playback(); });
    observer.observe(root);
    intersection.observe(root);
    window.addEventListener('pointermove', pointTo, { passive: true });
    window.addEventListener('pointerdown', pointTo, { passive: true });
    document.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', playback);
    reduced.addEventListener('change', motionChange);
    coarse.addEventListener('change', resize);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect(); intersection.disconnect();
      window.removeEventListener('pointermove', pointTo);
      window.removeEventListener('pointerdown', pointTo);
      document.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', playback);
      reduced.removeEventListener('change', motionChange);
      coarse.removeEventListener('change', resize);
    };
  }, []);

  return <div ref={rootRef} className={`after-hours-backdrop ${className}`} aria-hidden="true">
    <div className="after-hours-backdrop__wash" />
    <div className="after-hours-backdrop__grain" />
    <canvas ref={canvasRef} className="after-hours-backdrop__field" />
  </div>;
}

export default AfterHoursBackdrop;
