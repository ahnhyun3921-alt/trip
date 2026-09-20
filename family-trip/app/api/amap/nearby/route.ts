import { NextRequest, NextResponse } from 'next/server';
import { amap } from '@/lib/amap-server';

// 고덕 POI 분류 200300 = 공중화장실
const KINDS: Record<string, { keywords: string; types?: string }> = {
  toilet: { keywords: '厕所', types: '200300' },
  mall: { keywords: '商场' },
  fastfood: { keywords: '肯德基|麦当劳|星巴克' },
  metro: { keywords: '地铁站', types: '150500' },
};

// GET /api/amap/nearby?loc=lng,lat&kind=toilet
export async function GET(req: NextRequest) {
  const loc = req.nextUrl.searchParams.get('loc');
  const kind = KINDS[req.nextUrl.searchParams.get('kind') ?? 'toilet'] ?? KINDS.toilet;
  if (!loc) return NextResponse.json({ error: 'loc가 필요해요' }, { status: 400 });
  try {
    const params: Record<string, string> = { location: loc, keywords: kind.keywords, radius: '1500', sortrule: 'distance', offset: '20', extensions: 'base' };
    if (kind.types) params.types = kind.types;
    const r = await amap('/v3/place/around', params);
    const pois = (r.pois ?? []).map((p: { id: string; name: string; location: string; distance: string; address: unknown }) => {
      const [lng, lat] = String(p.location).split(',').map(Number);
      const d = Number(p.distance);
      return { id: p.id, name: p.name, lng, lat, distance: d, walkMin: Math.max(1, Math.round(d / 70)), address: typeof p.address === 'string' ? p.address : '' };
    });
    return NextResponse.json({ pois });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '찾지 못했어요' }, { status: 502 });
  }
}
