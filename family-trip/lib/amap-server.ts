// 서버에서만 씀 (키 노출 방지)
const KEY = process.env.AMAP_KEY ?? '';
const BASE = 'https://restapi.amap.com';

export const CITY_ZH: Record<string, string> = { 상하이: '上海', 항저우: '杭州' };
export function cityZh(c?: string | null) { return (c && CITY_ZH[c]) || c || '上海'; }

export async function amap(path: string, params: Record<string, string>) {
  if (!KEY) throw new Error('AMAP_KEY가 설정되지 않았어요');
  const q = new URLSearchParams({ ...params, key: KEY });
  const res = await fetch(`${BASE}${path}?${q}`, { next: { revalidate: 3600 } });
  const json = await res.json();
  if (json.status !== '1') throw new Error(`고덕 API 오류: ${json.info ?? 'unknown'}`);
  return json;
}

export function amapKeyUrl(path: string, params: Record<string, string>) {
  return `${BASE}${path}?${new URLSearchParams({ ...params, key: KEY })}`;
}
