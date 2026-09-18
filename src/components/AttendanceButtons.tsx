'use client';

import { AttendanceStatus } from '@/lib/types';

interface Props {
  status: AttendanceStatus;
  onMark: (status: AttendanceStatus) => void;
  compact?: boolean;
}

const BUTTONS: { label: string; emoji: string; value: AttendanceStatus; class: string }[] = [
  { label: 'Present', emoji: '✅', value: 'PRESENT', class: 'btn-present' },
  { label: 'Absent', emoji: '❌', value: 'ABSENT', class: 'btn-absent' },
  { label: 'Cancelled', emoji: '🚫', value: 'CANCELLED', class: 'btn-cancelled' },
];

export default function AttendanceButtons({ status, onMark, compact }: Props) {
  return (
    <div className="attendance-3d-group" style={{ gap: compact ? '0.75rem' : '1rem' }}>
      {BUTTONS.map(btn => {
        const isActive = status === btn.value;
        return (
          <button
            key={btn.value}
            onClick={(e) => {
              e.stopPropagation();
              onMark(isActive ? 'UNMARKED' : btn.value);
            }}
            className={`attendance-3d-btn ${btn.class} ${isActive ? 'active' : ''}`}
            title={isActive ? `Unmark ${btn.label}` : `Mark ${btn.label}`}
            aria-label={btn.label}
            aria-pressed={isActive}
            style={{ 
              width: compact ? '72px' : '80px', 
              height: compact ? '72px' : '80px',
              minWidth: '56px',
              minHeight: '56px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <span 
              className="emoji-3d" 
              style={{ 
                fontSize: compact ? '2rem' : '2.5rem',
                lineHeight: 1,
                display: 'block',
                transform: isActive ? 'translateZ(40px) scale(1.3)' : 'translateZ(0)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                filter: isActive ? 'drop-shadow(0 0 20px currentColor)' : 'none',
                fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif',
                textRendering: 'optimizeLegibility',
              }}
            >
              {btn.emoji}
            </span>
            <span className="label" style={{ 
              fontSize: '0.55rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: isActive ? 1 : 0.7,
              transform: 'translateZ(10px)',
              transition: 'opacity 0.2s'
            }}>
              {btn.label.slice(0, 3).toUpperCase()}
            </span>
          </button>
        );
      })}
    </div>
  );
}