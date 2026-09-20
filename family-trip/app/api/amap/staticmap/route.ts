import { NextRequest } from 'next/server';
import { amapKeyUrl } from '@/lib/amap-server';

// GET /api/amap/staticmap?a=lng,lat&b=lng,lat  → 두 지점 지도 이미지 (키는 서버에만)
export async function GET(req: NextRequest) {
  const a = req.nextUrl.searchParams.get('a');
  const b = req.nextUrl.searchParams.get('b');
  if (!b) return new Response('b가 필요해요', { status: 400 });
  const markers = [a ? `mid,0x9A9AA0,A:${a}` : null, `mid,0x2F97DE,B:${b}`].filter(Boolean).join('|');
  const params: Record<string, string> = { size: '700*340', scale: '2', markers };
  if (a) params.paths = `6,0x2F97DE,1,,:${a};${b}`;
  const res = await fetch(amapKeyUrl('/v3/staticmap', params), { next: { revalidate: 86400 } });
  if (!res.ok) return new Response('지도를 못 불러왔어요', { status: 502 });
  return new Response(res.body, { headers: { 'content-type': res.headers.get('content-type') ?? 'image/png', 'cache-control': 'public, max-age=86400' } });
}
