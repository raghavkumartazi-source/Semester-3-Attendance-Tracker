'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { AttendanceStatus } from '@/lib/types';
import { triggerCelebration } from './CelebrationBurst';

interface StatusPopoverProps {
  anchorEl: HTMLElement;
  currentStatus: AttendanceStatus;
  onSelect: (status: AttendanceStatus) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; emoji: string }[] = [
  { value: 'PRESENT', label: 'Present', emoji: '✅' },
  { value: 'ABSENT', label: 'Absent', emoji: '❌' },
  { value: 'CANCELLED', label: 'Cancelled', emoji: '🚫' },
  { value: 'UNMARKED', label: 'Unmarked', emoji: '↩️' },
];

function getIndicatorClass(status: AttendanceStatus, isSelected: boolean): string {
  switch (status) {
    case 'PRESENT':
      return isSelected
        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
        : 'bg-emerald-500/70';
    case 'ABSENT':
      return isSelected
        ? 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]'
        : 'bg-red-500/70';
    case 'CANCELLED':
      return isSelected
        ? 'bg-zinc-300 shadow-[0_0_6px_rgba(161,161,170,0.4)]'
        : 'bg-zinc-500/70';
    case 'UNMARKED':
      return 'bg-transparent border border-white/25';
  }
}

export default function StatusPopover({ anchorEl, currentStatus, onSelect, onClose }: StatusPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; openAbove: boolean } | null>(null);
  const [visible, setVisible] = useState(false);

  const calculate = useCallback(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const popoverHeight = 164; // 4 items × 34px + padding
    const popoverWidth = 148;
    const gap = 6;

    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openAbove = spaceBelow < popoverHeight && spaceAbove > spaceBelow;

    const top = openAbove
      ? rect.top + window.scrollY - popoverHeight - gap
      : rect.bottom + window.scrollY + gap;

    // Clamp horizontally
    let left = rect.left + window.scrollX + rect.width / 2 - popoverWidth / 2;
    const minLeft = 8;
    const maxLeft = window.innerWidth - popoverWidth - 8;
    left = Math.max(minLeft, Math.min(maxLeft, left));

    setPos({ top, left, openAbove });
  }, [anchorEl]);

  // Initial position + show
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    calculate();
    // Trigger enter animation on next frame
    requestAnimationFrame(() => setVisible(true));
  }, [calculate]);

  // Close on scroll/resize
  useEffect(() => {
    const scrollParents: EventTarget[] = [];
    let el: HTMLElement | null = anchorEl;
    while (el) {
      if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
        scrollParents.push(el);
      }
      el = el.parentElement;
    }
    scrollParents.push(window);

    const handleDismiss = () => onClose();

    scrollParents.forEach(p => p.addEventListener('scroll', handleDismiss, { passive: true }));
    window.addEventListener('resize', handleDismiss);

    return () => {
      scrollParents.forEach(p => p.removeEventListener('scroll', handleDismiss));
      window.removeEventListener('resize', handleDismiss);
    };
  }, [anchorEl, onClose]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current && !popoverRef.current.contains(target) &&
        !anchorEl.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [anchorEl, onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!pos) return null;

  const transformOrigin = pos.openAbove ? 'bottom center' : 'top center';

  return createPortal(
    <div
      ref={popoverRef}
      className="status-popover"
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        transformOrigin,
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'scale(1) translateY(0)'
          : pos.openAbove
            ? 'scale(0.92) translateY(6px)'
            : 'scale(0.92) translateY(-6px)',
        transition: 'opacity 150ms cubic-bezier(0.16, 1, 0.3, 1), transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        width: 148,
      }}
    >
      <motion.div
        className="rounded-[14px] p-[5px] flex flex-col gap-[3px]"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
        }}
        style={{
          background: 'linear-gradient(135deg, rgba(28, 30, 40, 0.45), rgba(18, 20, 28, 0.5))',
          backdropFilter: 'blur(45px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
        {STATUS_OPTIONS.map(({ value, label, emoji }) => {
          const isSelected = currentStatus === value;
          return (
            <motion.button
              key={value}
              variants={{
                hidden: { opacity: 0, x: -8 },
                visible: { opacity: 1, x: 0 },
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (value !== 'UNMARKED' && currentStatus !== value) {
                  triggerCelebration(value, e.clientX, e.clientY);
                }
                onSelect(value);
              }}
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="group flex items-center gap-[10px] rounded-[10px] px-[12px] py-[8px] text-[12px] font-semibold transition-colors duration-100"
              style={{
                background: isSelected
                  ? 'rgba(255,255,255,0.09)'
                  : 'transparent',
                color: isSelected
                  ? 'rgba(255,255,255,0.95)'
                  : 'rgba(255,255,255,0.55)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                }
              }}
            >
              {/* Status emoji */}
              <span className="flex-shrink-0 text-[13px] leading-none select-none">
                {emoji}
              </span>
              {/* Status dot indicator */}
              <span
                className={`inline-block h-[7px] w-[7px] rounded-full flex-shrink-0 transition-shadow duration-100 ${getIndicatorClass(value, isSelected)}`}
              />
              <span className="flex-1 text-left">{label}</span>
              {/* Check mark for selected item */}
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 opacity-70">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>,
    document.body
  );
}
