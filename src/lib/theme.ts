/* ============================================================
   lib/theme.ts
   ------------------------------------------------------------
   Bold 3D theme tokens for the cyberpunk academic interface.
   ============================================================ */

/** Subject accent map — bold, cyberpunk colors. */
export const SUBJECT_COLORS: Record<string, string> = {
  'EC-201': '#00ffff',
  'EC-202': '#00ffff',
  'EC-203': '#00ffff',
  'EO-201': '#00ff88',
  'EO-103': '#00ff88',
  'MA-201': '#ffaa00',
  'MO-201': '#ff0088',
  'HLM': '#aa00ff',
};

/** Subject emoji map. */
export const SUBJECT_EMOJIS: Record<string, string> = {
  'EC-201': '⚡',
  'EC-202': '🔌',
  'EC-203': '💡',
  'EO-201': '🌐',
  'EO-103': '🔬',
  'MA-201': '📐',
  'MO-201': '🧪',
  'HLM': '📚',
};

/** Time-of-day ambient colors for background. */
const AMBIENT_TIME_OF_DAY = [
  { hours: [0, 5], primary: '#0000ff', secondary: '#4400ff' },
  { hours: [5, 9], primary: '#00ff88', secondary: '#00aa66' },
  { hours: [9, 17], primary: '#00ffff', secondary: '#0088ff' },
  { hours: [17, 20], primary: '#ff6600', secondary: '#ff0088' },
  { hours: [20, 24], primary: '#ff0088', secondary: '#aa00ff' },
];

export function ambientColorsForHour(hour: number = new Date().getHours()) {
  return AMBIENT_TIME_OF_DAY.find((entry) => hour >= entry.hours[0] && hour < entry.hours[1]) ?? AMBIENT_TIME_OF_DAY[0];
}