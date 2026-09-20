'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useBlock, useBlocks, useDays } from '@/lib/data';
import { amapNav } from '@/lib/geo';
import { Icon, P } from '@/lib/icons';
import { TopBar } from '@/components/ui';

type Step = { kind: 'walk' | 'subway' | 'bus'; title: string; sub: string };
type Route = { mode: string; minutes: number; text: string; steps: Step[] };

export default function Move() {
  const id = String(useParams().id);
  const { data: b } = useBlock(id);
  const { data: days } = useDays();
  const day = days?.find((d) => d.id === b?.day_id);
  const { data: blocks } = useBlocks(b?.day_id);
  const idx = blocks?.findIndex((x) => x.id === id) ?? -1;
  const prev = idx > 0 ? blocks![idx - 1] : null;
  const [route, setRoute] = useState<Route | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!b?.lng || !prev?.lng || !day) return;
    fetch(`/api/amap/route?from=${prev.lng},${prev.lat}&to=${b.lng},${b.lat}&city=${encodeURIComponent(day.city)}`)
      .then((r) => r.json()).then((j) => (j.error ? setErr(j.error) : setRoute(j))).catch(() => setErr('경로를 불러오지 못했어요'));
  }, [b?.lng, b?.lat, prev?.lng, prev?.lat, day]);

  if (!b) return <main className="page"><TopBar back="/trip" /><p className="empty">불러오는 중…</p></main>;
  const to = b.lng && b.lat ? { lng: b.lng, lat: b.lat, name: b.zh_name || b.name } : null;
  const from = prev?.lng && prev.lat ? { lng: prev.lng, lat: prev.lat, name: prev.zh_name || prev.name } : undefined;

  return (
    <main className="page">
      <TopBar back={day ? `/day/${day.n}` : '/trip'} />
      <div className="head">
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{prev ? `${prev.name} → ${b.name}` : `${b.name}까지`}</span>
        <h1 className="big" style={{ fontSize: 26 }}>{route ? route.text : b.travel?.text ?? '이동하기'}</h1>
      </div>

      {to ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/amap/staticmap?${from ? `a=${from.lng},${from.lat}&` : ''}b=${to.lng},${to.lat}`} alt={`${b.name} 위치 지도`}
          style={{ display: 'block', width: 'calc(100% - 40px)', margin: '18px 20px 0', aspectRatio: '700 / 340', objectFit: 'cover', borderRadius: 24, background: 'var(--chip)' }} />
      ) : (
        <p className="err">이 블록에 중국어 이름이나 주소가 없어서 위치를 몰라요. <Link href={`/add?edit=${b.id}`} style={{ textDecoration: 'underline' }}>수정에서 넣어주세요</Link></p>
      )}

      {err && <p className="err">{err}</p>}
      {route && route.steps.length > 0 && (
        <ol style={{ listStyle: 'none', margin: '20px 0 0', padding: '0 24px' }}>
          {route.steps.map((s, i) => (
            <li key={i} style={{ display: 'flex', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ width: 36, height: 36, borderRadius: 13, background: s.kind === 'walk' ? 'var(--chip)' : 'var(--sky-tint)', color: s.kind === 'walk' ? 'var(--ink)' : 'var(--sky-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={s.kind === 'walk' ? P.walk : P.subway} size={18} />
                </span>
                {i < route.steps.length - 1 && <span style={{ width: 2, flexGrow: 1, minHeight: 14, background: '#e2e2e5' }} />}
              </div>
              <div style={{ padding: '6px 0 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <b style={{ fontSize: 15 }}>{s.title}</b>
                <span className="zh" style={{ fontSize: 13, color: 'var(--muted)' }}>{s.sub}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
      {!prev && to && <p className="empty">이날 첫 일정이라 출발지가 없어요. 고덕지도에서 지금 위치로 길을 찾아보세요.</p>}

      <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 0, width: '100%', maxWidth: 480, padding: '12px 20px calc(24px + env(safe-area-inset-bottom))', background: '#fff', display: 'flex', gap: 8 }}>
        <Link href={`/taxi/${b.id}`} className="btn outline" style={{ flex: 1 }}><Icon d={P.car} size={18} stroke={1.9} />택시 부르기</Link>
        {to && <a className="btn" style={{ flex: 1 }} href={amapNav(to, route?.mode === 'walk' ? 'walk' : 'bus', from)} target="_blank" rel="noreferrer">고덕지도<Icon d={P.out} size={16} stroke={2} /></a>}
      </div>
    </main>
  );
}
