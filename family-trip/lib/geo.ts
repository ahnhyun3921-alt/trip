// 브라우저 위치(WGS-84)를 고덕 좌표(GCJ-02)로 바꾸는 표준 변환식
const A = 6378245.0;
const EE = 0.00669342162296594323;

function outOfChina(lng: number, lat: number) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}
function tLat(x: number, y: number) {
  let r = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  r += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3;
  r += ((20 * Math.sin(y * Math.PI) + 40 * Math.sin((y / 3) * Math.PI)) * 2) / 3;
  r += ((160 * Math.sin((y / 12) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30)) * 2) / 3;
  return r;
}
function tLng(x: number, y: number) {
  let r = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  r += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3;
  r += ((20 * Math.sin(x * Math.PI) + 40 * Math.sin((x / 3) * Math.PI)) * 2) / 3;
  r += ((150 * Math.sin((x / 12) * Math.PI) + 300 * Math.sin((x / 30) * Math.PI)) * 2) / 3;
  return r;
}
export function wgsToGcj(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat)) return [lng, lat];
  let dLat = tLat(lng - 105, lat - 35);
  let dLng = tLng(lng - 105, lat - 35);
  const radLat = (lat / 180) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sq = Math.sqrt(magic);
  dLat = (dLat * 180) / (((A * (1 - EE)) / (magic * sq)) * Math.PI);
  dLng = (dLng * 180) / ((A / sq) * Math.cos(radLat) * Math.PI);
  return [lng + dLng, lat + dLat];
}

export function getHere(): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('이 기기에서 위치를 쓸 수 없어요'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(wgsToGcj(p.coords.longitude, p.coords.latitude)),
      () => reject(new Error('위치 권한을 허용하면 근처를 찾을 수 있어요')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}

// ---- 고덕지도 앱/웹 열기 (uri.amap.com: 앱이 있으면 앱, 없으면 웹) ----
const SRC = 'family-trip';
export function amapNav(to: { lng: number; lat: number; name: string }, mode: 'bus' | 'walk' | 'car' = 'bus', from?: { lng: number; lat: number; name: string }) {
  const q = new URLSearchParams({
    to: `${to.lng},${to.lat},${to.name}`,
    mode,
    policy: '1',
    src: SRC,
    coordinate: 'gaode',
    callnative: '1',
  });
  if (from) q.set('from', `${from.lng},${from.lat},${from.name}`);
  return `https://uri.amap.com/navigation?${q.toString()}`;
}
export function amapSearch(keyword: string, center?: [number, number]) {
  const q = new URLSearchParams({ keyword, src: SRC, coordinate: 'gaode', callnative: '1', view: 'list' });
  if (center) q.set('center', `${center[0]},${center[1]}`);
  return `https://uri.amap.com/search?${q.toString()}`;
}
export function amapMarker(p: { lng: number; lat: number; name: string }) {
  const q = new URLSearchParams({ position: `${p.lng},${p.lat}`, name: p.name, src: SRC, coordinate: 'gaode', callnative: '1' });
  return `https://uri.amap.com/marker?${q.toString()}`;
}

// 디디: 앱 스킴은 기기에서 꼭 한 번 확인하세요. 안 열리면 주소 복사 후 앱에서 붙여넣기.
export const DIDI_APP = 'diditaxi://';
