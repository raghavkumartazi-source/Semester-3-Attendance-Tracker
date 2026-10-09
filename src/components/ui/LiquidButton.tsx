'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEventHandler } from 'react';
import './liquid-button.css';

export type LiquidButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  href?: string;
  variant?: 'liquid' | 'starfield' | 'quiet';
  fullWidth?: boolean;
  target?: string;
  rel?: string;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
};

function hash(value: number) {
  const wave = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return wave - Math.floor(wave);
}

/** Returns a point at constant arc speed along the button's rounded outline. */
function outlinePoint(width: number, height: number, radius: number, progress: number) {
  const horizontal = width - radius * 2;
  const vertical = height - radius * 2;
  const quarter = Math.PI * radius / 2;
  const segments = [horizontal, quarter, vertical, quarter, horizontal, quarter, vertical, quarter];
  let distance = ((progress % 1 + 1) % 1) * (horizontal * 2 + vertical * 2 + quarter * 4);
  let segment = 0;
  while (distance > segments[segment] && segment < 7) distance -= segments[segment++];
  switch (segment) {
    case 0: return [radius + distance, 1];
    case 1: { const angle = distance / radius - Math.PI / 2; return [width - radius + Math.cos(angle) * radius, radius + Math.sin(angle) * radius]; }
    case 2: return [width - 1, radius + distance];
    case 3: { const angle = distance / radius; return [width - radius + Math.cos(angle) * radius, height - radius + Math.sin(angle) * radius]; }
    case 4: return [width - radius - distance, height - 1];
    case 5: { const angle = distance / radius + Math.PI / 2; return [radius + Math.cos(angle) * radius, height - radius + Math.sin(angle) * radius]; }
    case 6: return [1, height - radius - distance];
    default: { const angle = distance / radius + Math.PI; return [radius + Math.cos(angle) * radius, radius + Math.sin(angle) * radius]; }
  }
}

/**
 * Native controls with an opt-in visual layer. Interaction timing is adapted
 * from Kunal Chaudhary's MIT liquid-buttons demo (110ms impact, rebound, roll).
 * The Originkit starfield docs inform the deterministic grid and arc-speed lights.
 * Labels remain DOM text; these lightweight effects do not claim glass refraction.
 */
export function LiquidButton({
  href,
  variant = 'liquid',
  fullWidth = false,
  className = '',
  children,
  disabled = false,
  type = 'button',
  onClick,
  ...rest
}: LiquidButtonProps) {
  const rootRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const shellRef = useRef<HTMLSpanElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root: HTMLElement | null = rootRef.current;
    const shell = shellRef.current;
    const ripple = rippleRef.current;
    if (!root || !shell || !ripple || disabled) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let impact: Animation | undefined;
    let wave: Animation | undefined;
    let moveFrame = 0;
    let pointerX = .5;
    let pointerY = .5;

    const move = (event: PointerEvent) => {
      if (reduced.matches || event.pointerType !== 'mouse') return;
      const bounds = root.getBoundingClientRect();
      pointerX = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      pointerY = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      if (moveFrame) return;
      moveFrame = requestAnimationFrame(() => {
        moveFrame = 0;
        root.style.setProperty('--liquid-x', `${pointerX * 100}%`);
        root.style.setProperty('--liquid-y', `${pointerY * 100}%`);
        root.style.setProperty('--liquid-rx', `${(pointerY - .5) * -5}deg`);
        root.style.setProperty('--liquid-ry', `${(pointerX - .5) * 6}deg`);
      });
    };
    const reset = () => {
      root.style.setProperty('--liquid-rx', '0deg');
      root.style.setProperty('--liquid-ry', '0deg');
    };
    const press = (event?: PointerEvent) => {
      if (reduced.matches) return;
      impact?.cancel();
      wave?.cancel();
      if (event) {
        const bounds = root.getBoundingClientRect();
        ripple.style.left = `${event.clientX - bounds.left}px`;
        ripple.style.top = `${event.clientY - bounds.top}px`;
      } else {
        ripple.style.left = '50%';
        ripple.style.top = '50%';
      }
      // Only the glass layer rolls. The control and its text keep a stable hit area.
      impact = shell.animate([
        { transform: 'perspective(650px) translateY(-2px) rotateX(0deg) scale(1)', offset: 0 },
        { transform: 'perspective(650px) translateY(2px) rotateX(0deg) scale(1.025, .91)', offset: .12 },
        { transform: 'perspective(650px) translateY(-3px) rotateX(0deg) scale(.995, 1.035)', offset: .28 },
        { transform: 'perspective(650px) translateY(-2px) rotateX(180deg) scale(1, .94)', offset: .62 },
        { transform: 'perspective(650px) translateY(0) rotateX(360deg) scale(1)', offset: 1 },
      ], { duration: 950, easing: 'cubic-bezier(.22,.75,.23,1)' });
      wave = ripple.animate([
        { transform: 'translate(-50%, -50%) scale(.08)', opacity: .8 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
      ], { duration: 850, easing: 'cubic-bezier(.16,1,.3,1)' });
    };
    const keyDown = (event: KeyboardEvent) => {
      if (!event.repeat && (event.key === 'Enter' || (!href && event.key === ' '))) press();
    };
    const motionChange = () => {
      if (reduced.matches) { impact?.cancel(); wave?.cancel(); reset(); }
    };
    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerleave', reset);
    root.addEventListener('pointerdown', press, { passive: true });
    root.addEventListener('pointercancel', reset);
    root.addEventListener('keydown', keyDown);
    reduced.addEventListener('change', motionChange);
    return () => {
      impact?.cancel(); wave?.cancel();
      cancelAnimationFrame(moveFrame);
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', reset);
      root.removeEventListener('pointerdown', press);
      root.removeEventListener('pointercancel', reset);
      root.removeEventListener('keydown', keyDown);
      reduced.removeEventListener('change', motionChange);
    };
  }, [disabled, href]);

  useEffect(() => {
    const root: HTMLElement | null = rootRef.current;
    const canvas = canvasRef.current;
    if (variant !== 'starfield' || !root || !canvas || disabled) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastFrame = 0;
    let elapsed = 0;
    let active = false;
    let visible = false;
    let impulse = 0;
    const draw = (time: number, intensity: number) => {
      context.clearRect(0, 0, width, height);
      if (!width || !height) return;
      const radius = Math.min(height / 2, width / 2, 22);
      context.save();
      context.beginPath();
      context.roundRect(1, 1, width - 2, height - 2, radius);
      context.clip();
      const cell = 6;
      const columns = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);
      // Sine-hashed cells stay identical across visits and resizes.
      for (let row = 1; row < rows; row++) {
        for (let col = 1; col < columns; col++) {
          const seed = hash(row * 233 + col * 19);
          if (seed < .63) continue;
          const sparkle = Math.pow(.5 + .5 * Math.sin(time * (1.1 + seed * 2) + seed * 31), 5);
          context.fillStyle = `rgba(244,184,169,${(.07 + sparkle * .44) * intensity})`;
          const size = seed > .92 ? 2 : 1;
          context.fillRect(col * cell, row * cell, size, size);
        }
      }
      context.restore();
      for (let light = 0; light < 2; light++) {
        for (let trail = 16; trail >= 0; trail--) {
          const [x, y] = outlinePoint(width - 2, height - 2, radius, time * .075 + light * .5 - trail * .003);
          context.beginPath();
          context.fillStyle = `rgba(255,202,177,${(1 - trail / 17) * (.28 + intensity * .55)})`;
          context.arc(x + 1, y + 1, trail ? 1 : 1.7, 0, Math.PI * 2);
          context.fill();
        }
      }
    };
    const tick = (now: number) => {
      if (!visible || document.hidden || reduced.matches) { frame = 0; return; }
      frame = requestAnimationFrame(tick);
      if (lastFrame && now - lastFrame < 1000 / 30) return;
      const delta = lastFrame ? Math.min((now - lastFrame) / 1000, .1) : 1 / 30;
      lastFrame = now;
      elapsed += delta;
      impulse = Math.max(0, impulse - delta * .75);
      draw(elapsed, active ? 1 : Math.max(.18, impulse));
      // Resting buttons retain a still frame; no persistent ticker per control.
      if (!active && impulse === 0) { cancelAnimationFrame(frame); frame = 0; }
    };
    const playback = () => {
      if (visible && !document.hidden && !reduced.matches && (active || impulse)) {
        if (!frame) { lastFrame = 0; frame = requestAnimationFrame(tick); }
      } else if (frame) { cancelAnimationFrame(frame); frame = 0; }
    };
    const enter = () => { active = true; playback(); };
    const leave = () => { active = false; impulse = .5; playback(); };
    const press = () => { impulse = 1; playback(); };
    const resize = () => {
      const bounds = root.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw(elapsed, .25);
    };
    const motionChange = () => { playback(); if (reduced.matches) draw(0, .18); };
    const observer = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; playback(); });
    observer.observe(root);
    intersection.observe(root);
    root.addEventListener('pointerenter', enter);
    root.addEventListener('pointerleave', leave);
    root.addEventListener('focusin', enter);
    root.addEventListener('focusout', leave);
    root.addEventListener('pointerdown', press, { passive: true });
    document.addEventListener('visibilitychange', playback);
    reduced.addEventListener('change', motionChange);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect(); intersection.disconnect();
      root.removeEventListener('pointerenter', enter);
      root.removeEventListener('pointerleave', leave);
      root.removeEventListener('focusin', enter);
      root.removeEventListener('focusout', leave);
      root.removeEventListener('pointerdown', press);
      document.removeEventListener('visibilitychange', playback);
      reduced.removeEventListener('change', motionChange);
    };
  }, [disabled, variant]);

  const classes = `liquid-button liquid-button--${variant}${fullWidth ? ' liquid-button--full' : ''} ${className}`;
  const content = <>
    <span ref={shellRef} className="liquid-button__shell" aria-hidden="true"><span className="liquid-button__caustic" /><span className="liquid-button__glint" /></span>
    <span className="liquid-button__effects" aria-hidden="true"><span ref={rippleRef} className="liquid-button__ripple" />{variant === 'starfield' ? <canvas ref={canvasRef} className="liquid-button__stars" /> : null}</span>
    <span className="liquid-button__label">{children}</span>
  </>;

  if (href) {
    return <Link
      {...rest as AnchorHTMLAttributes<HTMLAnchorElement>}
      href={href}
      ref={element => { rootRef.current = element; }}
      className={classes}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : rest.tabIndex}
      onClick={event => { if (disabled) event.preventDefault(); else onClick?.(event); }}
    >{content}</Link>;
  }
  return <button {...rest} ref={element => { rootRef.current = element; }} type={type} className={classes} disabled={disabled} onClick={onClick}>{content}</button>;
}

export default LiquidButton;
