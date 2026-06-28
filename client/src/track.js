// Shared config for the personal tour tracker
export const STATUSES = [
  { id: 'considering', label: 'Considering', color: 'amber', emoji: '🤔' },
  { id: 'scheduled', label: 'Scheduled Visit', color: 'blue', emoji: '📅' },
  { id: 'visited', label: 'Visited', color: 'green', emoji: '✅' },
  { id: 'favorite', label: 'Favorite', color: 'rose', emoji: '❤️' },
  { id: 'passed', label: 'Passed', color: 'gray', emoji: '🚫' },
];

export const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.id, s]));

export const STATUS_CLASSES = {
  amber: { chip: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500', col: 'border-t-amber-400' },
  blue: { chip: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500', col: 'border-t-blue-400' },
  green: { chip: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500', col: 'border-t-green-400' },
  rose: { chip: 'bg-rose-100 text-rose-800 border-rose-200', dot: 'bg-rose-500', col: 'border-t-rose-400' },
  gray: { chip: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400', col: 'border-t-gray-300' },
};
