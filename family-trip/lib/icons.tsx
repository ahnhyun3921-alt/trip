import type { BlockType } from './types';

export const TYPE_PATHS: Record<BlockType, string> = {
  tour: 'M3 9l9-5 9 5M5 9v11M19 9v11M3 20h18M9 20v-6h6v6',
  food: 'M4 11h16a8 8 0 0 1-16 0zM9 7c0-1.5 1-1.5 1-3M13 7c0-1.5 1-1.5 1-3',
  shop: 'M6 8h12l-1 12H7L6 8zM9 8a3 3 0 0 1 6 0',
  move: 'M9 3h6a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM6 11h12M9 21l1.5-4M15 21l-1.5-4',
  stay: 'M3 18V7M3 13h18v5M21 13a3 3 0 0 0-3-3h-7v3M5.5 10a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0',
};
export const TYPE_LABEL: Record<BlockType, string> = { tour: '관광', food: '식사', shop: '쇼핑', move: '이동', stay: '숙소' };

export const P = {
  back: 'M15 5l-7 7 7 7',
  plus: 'M12 5v14M5 12h14',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  out: 'M7 17L17 7M9 7h8v8',
  chev: 'M9 5l7 7-7 7',
  check: 'M5 12l5 5 9-10',
  receipt: 'M5 4h14v17l-3-2-2 2-2-2-2 2-2-2-3 2zM9 9h6M9 13h4',
  walk: 'M13 4.5a1.5 1.5 0 1 0 .1 0M10 21l2-6 3 3v3M8 12l2-4 4 1 2 3M12 9l-1 6',
  subway: 'M9 3h6a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM6 11h12M9 21l1.5-4M15 21l-1.5-4',
  car: 'M4 13l2-5h12l2 5v4H4zM6 17v2M18 17v2',
  plane: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z',
  train: 'M8 3h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM5 10h14M8 21l2-4M16 21l-2-4',
  hotel: 'M6 7h12a2 2 0 0 1 2 2v10H4V9a2 2 0 0 1 2-2zM9 7V4h6v3M4 13h16',
  ticket: 'M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4zM14 7v10',
  star: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.3l6-.7z',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM9.5 10a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6',
  wc: 'M7 4.5a1.5 1.5 0 1 0 .1 0M17 4.5a1.5 1.5 0 1 0 .1 0M5 21v-6H4l1.5-7h3L10 15H9v6M15 21V8h4v7h-1v6M12 3v18',
  clock: 'M12 13m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0M12 9v4l2.5 2M9 3h6',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  pencil: 'M4 20h4l10-10-4-4L4 16v4zM14 6l4 4',
  grip: 'M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01',
};

export function Icon({ d, size = 20, stroke = 1.8, color = 'currentColor', fill = 'none' }: { d: string; size?: number; stroke?: number; color?: string; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function Face({ d, size = 30 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 22a12 12 0 1 0 24 0a12 12 0 1 0-24 0" />
      <path d={d} />
    </svg>
  );
}
