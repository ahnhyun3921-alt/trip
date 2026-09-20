export type Member = { name: string; face: string; color: string };

// 얇은 라인 얼굴 (viewBox 0 0 40 40)
const base = 'M16 21v1M24 21v1M16.5 26.5c2 1.6 5 1.6 7 0';
export const MEMBERS: Member[] = [
  { name: '안재은', color: '#111111', face: 'M8.5 19c1-6 5-9 11.5-9s10.5 3 11.5 9M18.5 21.5h3M16.5 27.5c2 1.6 5 1.6 7 0M12.5 21.5a3 3 0 1 0 6 0a3 3 0 1 0-6 0M21.5 21.5a3 3 0 1 0 6 0a3 3 0 1 0-6 0' },
  { name: '김혜련', color: '#111111', face: 'M8 23c-2.5-3-.5-6.5 1.5-7.5c0-4 4-6.5 7-5c2-2.2 6-2.2 8 0c3-1.5 7 1 7 5c2 1 4 4.5 1.5 7.5' + base },
  { name: '안윤진', color: '#111111', face: 'M7 35V22c0-7.5 5.5-13 13-13s13 5.5 13 13v13M11 16c4 2.5 13 2.5 18-1' + base },
  { name: '안현진', color: '#111111', face: 'M16.5 6.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0M8.5 19c1-6 5-9 11.5-9s10.5 3 11.5 9M8.5 19v4M31.5 19v4' + base },
  { name: '안철진', color: '#111111', face: 'M8 18l2.5-6 3 3 2.5-5 3 4 3-4 2.5 5 3-3 2.5 6' + base },
];

export function memberByName(name?: string | null) {
  return MEMBERS.find((m) => m.name === name) ?? null;
}
