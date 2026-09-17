@import "tailwindcss";

:root {
  --background: #07080b;
  --foreground: #f0f0f5;
  --glass-bg: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
  --glass-border: rgba(255,255,255,0.13);
  --glass-highlight: rgba(255,255,255,0.15);
  --glass-shadow-dark: rgba(0,0,0,0.45);
}

* {
  -webkit-tap-highlight-color: transparent;
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--background);
  color: var(--foreground);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

@keyframes ringDraw {
  from { stroke-dasharray: 0 264; }
}

@keyframes countPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

@keyframes nowPulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
  50% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
}

@keyframes progressFill {
  from { width: 0%; }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes floatOrb {
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(5%, 5%) scale(1.05); }
  66% { transform: translate(-2%, 4%) scale(0.95); }
  100% { transform: translate(0, 0) scale(1); }
}

.animate-orb {
  animation: floatOrb 20s ease-in-out infinite;
}

.animate-orb-slow {
  animation: floatOrb 25s ease-in-out infinite reverse;
}

.animate-orb-slower {
  animation: floatOrb 30s ease-in-out infinite;
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}

.animate-scale-in {
  animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}

.animate-slide-in-right {
  animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}

.stagger-1 { animation-delay: 0.06s; }
.stagger-2 { animation-delay: 0.12s; }
.stagger-3 { animation-delay: 0.18s; }
.stagger-4 { animation-delay: 0.24s; }
.stagger-5 { animation-delay: 0.30s; }
.stagger-6 { animation-delay: 0.36s; }
.stagger-7 { animation-delay: 0.42s; }
.stagger-8 { animation-delay: 0.48s; }

/* Skeleton shimmer */
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.03) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.8s ease-in-out infinite;
  border-radius: 12px;
}

/* Progress bar fill */
.progress-bar-fill {
  animation: progressFill 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

/* SVG ring draw animation */
.ring-animated {
  animation: ringDraw 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* NOW pulse indicator */
.now-pulse {
  animation: nowPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
::-webkit-scrollbar-corner {
  background: transparent;
}

/* ============================================
   LIQUID GLASS MATERIAL SYSTEM
   ============================================ */

/*
 * Level 1: glass-surface
 * Base-level glass slab. For large containers like the Master Register.
 * Sits just above the background.
 */
.glass-surface {
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.03),
    rgba(255, 255, 255, 0.005)
  );
  backdrop-filter: blur(32px) saturate(150%);
  -webkit-backdrop-filter: blur(32px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.14),
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.02),
    0 20px 60px -10px rgba(0, 0, 0, 0.45),
    0 4px 20px 0 rgba(0, 0, 0, 0.2);
}
/* Specular reflection pseudo-element */
.glass-surface::before {
  content: '';
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.16),
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.03),
    0 8px 32px 0 rgba(0, 0, 0, 0.35);
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
.glass-elevated:hover {
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.18),
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.03),
    0 12px 40px 0 rgba(0, 0, 0, 0.4);
}
.glass-elevated::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    120deg,
    rgba(255, 255, 255, 0.06) 0%,
    transparent 40%
  );
  pointer-events: none;
  z-index: 1;
}

/*
 * Level 3: glass-floating
 * Popovers, floating bars, modals. Highest Z-depth.
 * Most visible glass with strong blur and bright edges.
 */
.glass-floating {
  position: relative;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.07),
    rgba(255, 255, 255, 0.015)
  );
  backdrop-filter: blur(48px) saturate(160%);
  -webkit-backdrop-filter: blur(48px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.04),
    0 24px 60px -8px rgba(0, 0, 0, 0.5),
    0 8px 20px 0 rgba(0, 0, 0, 0.25);
}
.glass-floating::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    110deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.03) 25%,
    transparent 50%
  );
  pointer-events: none;
  z-index: 1;
}

/*
 * Level R: glass-recessed
 * Cells, inputs, recessed areas. Sunken into the surface.
 */
.glass-recessed {
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.3),
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.04);
}

/*
 * Frozen pane: for sticky columns
 */
.glass-frozen {
  background: linear-gradient(
    180deg,
    rgba(16, 18, 24, 0.65),
    rgba(12, 14, 20, 0.55)
  );
  backdrop-filter: blur(32px) saturate(150%);
  -webkit-backdrop-filter: blur(32px) saturate(150%);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    4px 0 16px rgba(0, 0, 0, 0.3),
    inset -1px 0 0 rgba(255, 255, 255, 0.06);
}

.glass-frozen-right {
  background: linear-gradient(
    180deg,
    rgba(16, 18, 24, 0.65),
    rgba(12, 14, 20, 0.55)
  );
  backdrop-filter: blur(32px) saturate(150%);
  -webkit-backdrop-filter: blur(32px) saturate(150%);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    -4px 0 16px rgba(0, 0, 0, 0.3),
    inset 1px 0 0 rgba(255, 255, 255, 0.06);
}

/* Interactive glass controls */
.glass-control {
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.07),
    rgba(255, 255, 255, 0.02)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}
.glass-control:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.11),
    rgba(255, 255, 255, 0.04)
  );
  border-color: rgba(255, 255, 255, 0.16);
}
.glass-control:active {
  transform: scale(0.97);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.01)
  );
}

/* Glass control — selected / active state */
.glass-control-active {
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12),
    rgba(255, 255, 255, 0.03)
  );
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(255, 255, 255, 0.04),
    0 4px 16px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* ========== LEGACY ALIASES ========== */
.glass-panel {
  position: relative;
  background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015));
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.14), inset 0 -1px 0 0 rgba(255,255,255,0.02), 0 20px 60px -10px rgba(0,0,0,0.45), 0 4px 20px 0 rgba(0,0,0,0.2);
}
.glass-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(115deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 30%, transparent 50%);
  pointer-events: none;
  z-index: 1;
}

.glass-card {
  position: relative;
  background: linear-gradient(140deg, rgba(255,255,255,0.09), rgba(255,255,255,0.025));
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.16), inset 0 -1px 0 0 rgba(255,255,255,0.03), 0 8px 32px 0 rgba(0,0,0,0.35);
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
.glass-card:hover {
  border-color: rgba(255,255,255,0.2);
}
.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(120deg, rgba(255,255,255,0.06) 0%, transparent 40%);
  pointer-events: none;
  z-index: 1;
}

.glass-button {
  position: relative;
  background: linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.2);
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}
.glass-button:hover {
  background: linear-gradient(135deg, rgba(255,255,255,0.11), rgba(255,255,255,0.04));
  border-color: rgba(255,255,255,0.16);
}
.glass-button:active {
  transform: scale(0.97);
}

/* Safe area for notched phones */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  body {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
