import { NextRequest, NextResponse } from 'next/server';
import { amap, cityZh } from '@/lib/amap-server';

// GET /api/amap/geocode?q=上海博物馆&city=상하이  (장소 이름이나 주소 → 좌표)
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  const city = cityZh(req.nextUrl.searchParams.get('city'));
  if (!q) return NextResponse.json({ error: 'q가 필요해요' }, { status: 400 });
  try {
    const r = await amap('/v3/place/text', { keywords: q, city, citylimit: 'true', offset: '1' });
    const p = r.pois?.[0];
    if (!p) return NextResponse.json({ error: '장소를 못 찾았어요' }, { status: 404 });
    const [lng, lat] = String(p.location).split(',').map(Number);
    return NextResponse.json({ lng, lat, name: p.name, address: typeof p.address === 'string' ? p.address : '' });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '찾지 못했어요' }, { status: 502 });
  }
}
