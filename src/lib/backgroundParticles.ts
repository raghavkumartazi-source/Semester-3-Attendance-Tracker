/* ============================================================
   lib/backgroundParticles.ts
   ------------------------------------------------------------
   Layer 5 engine: a lightweight <canvas> particle stream.

   initParticleCanvas(canvas) — bind a canvas (once) and start
                               the rAF loop on demand.
   emitParticle(x, y, color, type) — spawn motes at a point.

   Design constraints:
     • max 30 live particles (caps worst-case fill rate)
     • rAF loop self-terminates when idle (battery friendly)
     • capped devicePixelRatio (2) for 60fps on old phones
     • particles are removed after their life expires
   ============================================================ */

export type ParticleType = 'tap' | 'complete' | 'streak';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // remaining ms
  maxLife: number;
  size: number;
  color: string;
}

const MAX_PARTICLES = 30;
const DPR_CAP = 2;

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let rafId: number | null = null;
let resizeListener: (() => void) | null = null;

/** Per-spawn profile: count, speed, size, lifetime by trigger type. */
const PROFILES: Record<ParticleType, { count: number; speed: number; size: [number, number]; life: [number, number] }> = {
  tap: { count: 2, speed: 55, size: [1.4, 2.6], life: [1100, 1800] },
  complete: { count: 6, speed: 85, size: [1.8, 3.2], life: [1400, 2300] },
  streak: { count: 10, speed: 110, size: [2.2, 4.0], life: [1800, 2900] },
};

function randInRange([min, max]: [number, number]): number {
  return min + Math.random() * (max - min);
}

function resize(): void {
  if (!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function loop(): void {
  if (!ctx || !canvas) return;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  // Advance & cull. Iterate backwards for cheap removal.
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= 16; // approx per frame at 60fps
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    // Integrate motion (frame-rate independent-ish; 16ms assumption)
    p.x += p.vx * 0.016;
    p.y += p.vy * 0.016;
    // Slight upward buoyancy decay → embers arc over
    p.vy *= 0.985;
    p.vx *= 0.99;

    const t = p.life / p.maxLife; // 1 → 0
    ctx.globalAlpha = Math.max(0, Math.min(1, t * 1.1));
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * t), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (particles.length > 0) {
    rafId = requestAnimationFrame(loop);
  } else {
    // Idle: stop the loop until the next emission.
    rafId = null;
  }
}

function startLoop(): void {
  if (rafId !== null || !canvas || !ctx) return;
  rafId = requestAnimationFrame(loop);
}

/**
 * Bind a canvas element to the engine. Safe to call once on mount.
 */
export function initParticleCanvas(cv: HTMLCanvasElement): void {
  if (canvas === cv) return;
  destroyParticleCanvas();

  canvas = cv;
  ctx = cv.getContext('2d');
  if (!ctx) return;

  resize();
  resizeListener = () => resize();
  window.addEventListener('resize', resizeListener);
}

/** Tear down listeners and stop the loop (HMR-safe). */
export function destroyParticleCanvas(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (resizeListener) {
    window.removeEventListener('resize', resizeListener);
    resizeListener = null;
  }
  particles = [];
  canvas = null;
  ctx = null;
}

/**
 * Emit particles at screen coordinates.
 *
 * @param x     viewport x (px)
 * @param y     viewport y (px)
 * @param color any CSS color
 * @param type  trigger profile: 'tap' | 'complete' | 'streak'
 */
export function emitParticle(
  x: number,
  y: number,
  color: string,
  type: ParticleType = 'tap'
): void {
  if (typeof document === 'undefined' || !ctx || !canvas) return;

  // Reduced motion: emit nothing. Canvas particles can't be throttled by CSS.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const profile = PROFILES[type] ?? PROFILES.tap;

  // Respect the particle cap so heavy bursts can't saturate old GPUs.
  const budget = MAX_PARTICLES - particles.length;
  if (budget <= 0) return;

  const count = Math.min(profile.count, budget);
  for (let i = 0; i < count; i++) {
    // Upward-biased cone, like embers feeding the horizon.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const speed = profile.speed * (0.6 + Math.random() * 0.8);
    const maxLife = randInRange(profile.life);

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: maxLife,
      maxLife,
      size: randInRange(profile.size),
      color,
    });
  }

  startLoop();
}

/** Burst helper for milestones. */
export function emitParticleBurst(
  x: number,
  y: number,
  color: string,
  type: ParticleType = 'streak'
): void {
  emitParticle(x, y, color, type);
}
