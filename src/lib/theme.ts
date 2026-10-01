/* ============================================================
   lib/theme.ts
   ------------------------------------------------------------
   Bold 3D theme tokens for the cyberpunk academic interface.
   ============================================================ */

/** Subject accent map — bold, cyberpunk colors. */
export const SUBJECT_COLORS: Record<string, string> = {
  'EC-201': '#91bfd2',
  'EC-202': '#91bfd2',
  'EC-203': '#91bfd2',
  'EO-201': '#a0d5ad',
  'EO-103': '#a0d5ad',
  'MA-201': '#d5bc86',
  'MO-201': '#d5a5b3',
  'HLM': '#b7afd5',
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
  { hours: [5, 9], primary: '#a0d5ad', secondary: '#00aa66' },
  { hours: [9, 17], primary: '#91bfd2', secondary: '#0088ff' },
  { hours: [17, 20], primary: '#ff6600', secondary: '#d5a5b3' },
  { hours: [20, 24], primary: '#d5a5b3', secondary: '#b7afd5' },
];

export function ambientColorsForHour(hour: number = new Date().getHours()) {
  return AMBIENT_TIME_OF_DAY.find((entry) => hour >= entry.hours[0] && hour < entry.hours[1]) ?? AMBIENT_TIME_OF_DAY[0];
}