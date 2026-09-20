import { NextRequest, NextResponse } from 'next/server';
import { amap, cityZh } from '@/lib/amap-server';

type Step = { kind: 'walk' | 'subway' | 'bus'; title: string; sub: string };

// GET /api/amap/route?from=lng,lat&to=lng,lat&city=상하이
export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from');
  const to = req.nextUrl.searchParams.get('to');
  const city = cityZh(req.nextUrl.searchParams.get('city'));
  if (!from || !to) return NextResponse.json({ error: 'from, to가 필요해요' }, { status: 400 });
  try {
    const walk = await amap('/v3/direction/walking', { origin: from, destination: to });
    const wp = walk.route?.paths?.[0];
    const walkMin = wp ? Math.max(1, Math.round(Number(wp.duration) / 60)) : null;
    if (walkMin != null && walkMin <= 15) {
      return NextResponse.json({ mode: 'walk', minutes: walkMin, text: `도보 ${walkMin}분`, steps: [{ kind: 'walk', title: `도보 약 ${walkMin}분`, sub: `${wp.distance}m` }] });
    }
    const tr = await amap('/v3/direction/transit/integrated', { origin: from, destination: to, city, cityd: city, strategy: '0' });
    const t = tr.route?.transits?.[0];
    if (!t) {
      return NextResponse.json({ mode: 'taxi', minutes: walkMin ?? 0, text: '택시 추천', steps: [] });
    }
    const steps: Step[] = [];
    for (const seg of t.segments ?? []) {
      const w = seg.walking;
      if (w && Number(w.duration) > 0) steps.push({ kind: 'walk', title: `도보 약 ${Math.max(1, Math.round(Number(w.duration) / 60))}분`, sub: `${w.distance}m` });
      const line = seg.bus?.buslines?.[0];
      if (line) {
        const isSubway = /地铁|号线/.test(line.name ?? '');
        const shortName = String(line.name ?? '').replace(/\(.*\)/, '');
        steps.push({
          kind: isSubway ? 'subway' : 'bus',
          title: `${shortName} 탑승`,
          sub: `${line.departure_stop?.name ?? ''} → ${line.arrival_stop?.name ?? ''} · ${Number(line.via_num ?? 0) + 1}정거장`,
        });
      }
    }
    const minutes = Math.round(Number(t.duration) / 60);
    const hasSubway = steps.some((s) => s.kind === 'subway');
    return NextResponse.json({ mode: 'transit', minutes, text: `${hasSubway ? '지하철' : '버스'} 약 ${minutes}분`, steps });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '경로를 못 찾았어요' }, { status: 502 });
  }
}
