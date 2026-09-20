'use client';
import { useMemo, useState } from 'react';
import { amapNav, amapSearch, getHere } from '@/lib/geo';
import { Icon, P, TYPE_PATHS } from '@/lib/icons';
import { GATE_LABEL, matchStation, MetroStation, searchStations } from '@/lib/metro-toilets';
import { BlackBar, TopBar } from '@/components/ui';

type Poi = { id: string; name: string; lng: number; lat: number; distance: number; walkMin: number; address: string };
const KINDS = [
  { id: 'toilet', label: '공중화장실' },
  { id: 'metro', label: '지하철역' },
  { id: 'mall', label: '쇼핑몰' },
  { id: 'fastfood', label: 'KFC·맥도날드·스타벅스' },
] as const;
type Kind = (typeof KINDS)[number]['id'];

function StationToilets({ s }: { s: MetroStation }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
      {s.toilets.map((t, i) => (
        <span key={i} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
          <b style={{ fontWeight: 700 }}>{t.line}호선</b> · {GATE_LABEL[t.gate]}, {t.where}{t.accessible ? ' · 장애인 화장실' : ''}
        </span>
      ))}
    </span>
  );
}

export default function Toilet() {
  const [kind, setKind] = useState<Kind>('toilet');
  const [here, setHere] = useState<[number, number] | null>(null);
  const [pois, setPois] = useState<Poi[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [phrase, setPhrase] = useState(false);
  const [q, setQ] = useState('');

  const find = async (k: Kind = kind) => {
    setBusy(true); setErr(null);
    try {
      const loc = here ?? (await getHere());
      setHere(loc);
      const r = await fetch(`/api/amap/nearby?loc=${loc[0]},${loc[1]}&kind=${k}`);
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      setPois(j.pois);
    } catch (e) { setErr(e instanceof Error ? e.message : '찾지 못했어요'); }
    setBusy(false);
  };

  // 지하철역 탭: 같은 역이 호선별로 여러 번 나오면 하나로
  const metroRows = useMemo(() => {
    if (kind !== 'metro' || !pois) return [];
    const seen = new Set<string>();
    return pois.map((p) => ({ p, s: matchStation(p.name) })).filter(({ p, s }) => {
      const key = s?.zh ?? p.name.replace(/\(.*?\)/g, '');
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  }, [kind, pois]);
  const stations = useMemo(() => searchStations(q), [q]);

  return (
    <main className="page">
      <TopBar back="/trip" />
      <div className="head">
        <h1 className="big">근처 화장실</h1>
        <div className="meta"><span>지금 위치에서 가까운 순</span>{pois && <><span className="dot" /><span>{kind === 'metro' ? metroRows.length : pois.length}곳</span></>}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '20px 24px 0', overflowX: 'auto' }}>
        {KINDS.map((k) => (
          <button key={k.id} className="btn small" aria-pressed={kind === k.id}
            style={{ flexShrink: 0, background: kind === k.id ? 'var(--ink)' : 'var(--chip)', color: kind === k.id ? '#fff' : 'var(--text)' }}
            onClick={() => { setKind(k.id); setPois(null); if (here) find(k.id); }}>{k.label}</button>
        ))}
      </div>

      {!pois && (
        <div style={{ padding: '20px 24px 0' }}>
          <button className="btn" style={{ width: '100%' }} onClick={() => find()} disabled={busy}>{busy ? '찾는 중…' : '지금 위치로 찾기'}</button>
        </div>
      )}
      {err && <p className="err">{err}{here && <> · <a href={amapSearch('厕所', here)} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>고덕지도에서 찾기</a></>}</p>}

      {pois && kind !== 'metro' && (
        <div className="rows" style={{ marginTop: 12 }}>
          {pois.length === 0 && <p className="empty">1.5km 안에 없어요. 지하철역 탭도 눌러보세요.</p>}
          {pois.map((p) => (
            <a key={p.id} className="row" href={amapNav({ lng: p.lng, lat: p.lat, name: p.name }, 'walk')} target="_blank" rel="noreferrer">
              <span className="circle"><Icon d={kind === 'toilet' ? P.wc : P.pin} size={19} /></span>
              <span className="txt"><b className="zh">{p.name}</b><span>도보 약 {p.walkMin}분 · {p.distance}m</span></span>
              <Icon d={P.out} size={18} color="#9a9aa0" stroke={2} />
            </a>
          ))}
        </div>
      )}

      {pois && kind === 'metro' && (
        <div className="rows" style={{ marginTop: 12 }}>
          {metroRows.length === 0 && <p className="empty">1.5km 안에 지하철역이 없어요.</p>}
          {metroRows.map(({ p, s }) => (
            <a key={p.id} className="row" href={amapNav({ lng: p.lng, lat: p.lat, name: p.name }, 'walk')} target="_blank" rel="noreferrer" style={{ alignItems: 'flex-start', padding: '12px 0' }}>
              <span className="circle"><Icon d={P.subway} size={19} /></span>
              <span className="txt">
                <b>{s ? `${s.ko} ` : ''}<span className="zh" style={{ fontWeight: 600 }}>{s?.zh ?? p.name}</span></b>
                <span>도보 약 {p.walkMin}분 · {p.distance}m</span>
                {s ? <StationToilets s={s} /> : <span>이 역은 화장실 정보가 없어요</span>}
              </span>
              <Icon d={P.out} size={18} color="#9a9aa0" stroke={2} />
            </a>
          ))}
        </div>
      )}

      <div className="sec-h"><span><b style={{ color: 'var(--ink)' }}>와이탄</b>화장실 지도</span></div>
      <div className="rows">
        <a className="row" href="https://wc.dfancy.cn" target="_blank" rel="noreferrer">
          <span className="circle"><Icon d={P.map} size={19} /></span>
          <span className="txt"><b className="zh">外滩晓厕</b><span>상하이시 제공 · 휴지·와이파이 여부까지 나와요. 크롬 번역으로 한국어로 보기</span></span>
          <Icon d={P.out} size={18} color="#9a9aa0" stroke={2} />
        </a>
      </div>

      <div className="sec-h"><span><b style={{ color: 'var(--ink)' }}>지하철역</b>화장실 찾기</span></div>
      <div style={{ padding: '0 24px' }}>
        <label className="sr" htmlFor="st">역 이름</label>
        <input id="st" value={q} onChange={(e) => setQ(e.target.value)} placeholder="역 이름 (예: 난징둥루, 豫园)" style={{ width: '100%', minHeight: 46, border: 'none', borderRadius: 14, padding: '0 16px', background: 'var(--surface)', fontSize: 16 }} />
        <span style={{ display: 'block', marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>상하이 지하철 안내(2024년 10월) 기준이라 바뀌었을 수 있어요 · 인터넷 없이도 보여요</span>
      </div>
      <div className="rows" style={{ marginTop: 4 }}>
        {stations.length === 0 && <p className="empty" style={{ padding: '8px 0' }}>목록에 없는 역이에요. 위의 지하철역 탭으로 찾아보세요.</p>}
        {stations.map((s) => (
          <div className="row" key={s.zh} style={{ alignItems: 'flex-start', padding: '12px 0' }}>
            <span className="circle"><Icon d={P.subway} size={19} /></span>
            <span className="txt"><b>{s.ko} <span className="zh" style={{ fontWeight: 600 }}>{s.zh}</span></b><StationToilets s={s} /></span>
          </div>
        ))}
      </div>

      <div className="sec-h"><span><b style={{ color: 'var(--ink)' }}>알아두면</b>편해요</span></div>
      <div className="rows">
        <div className="row"><span className="circle"><Icon d={P.receipt} size={18} /></span><span className="txt"><b>휴지는 꼭 챙겨 다니기</b><span>백화점 화장실에도 없을 때가 있어요. 급하면 미니소 같은 잡화점에서 사요</span></span></div>
        <div className="row"><span className="circle"><Icon d={TYPE_PATHS.food} size={18} /></span><span className="txt"><b>식당 휴지는 유료인 곳도 있어요</b><span>테이블 휴지를 뜯으면 계산서에 붙는 경우가 있어요</span></span></div>
        <div className="row"><span className="circle"><Icon d={P.ticket} size={18} /></span><span className="txt"><b>‘개찰구 안’ 화장실</b><span>교통카드나 QR을 찍고 들어가야 쓸 수 있어요. 타러 들어가는 길에 들르기 좋아요</span></span></div>
        <div className="row"><span className="circle"><Icon d={P.pin} size={18} /></span><span className="txt"><b>쇼핑몰은 3~4층 화장실</b><span>1층보다 한산하고 깨끗한 편이에요</span></span></div>
        <div className="row"><span className="circle"><Icon d={P.check} size={18} /></span><span className="txt"><b className="zh">坐 좌식 · 蹲 재래식</b><span>칸 문에 붙은 글자로 구분해요. 다 재래식이면 장애인 칸을 찾아보세요</span></span></div>
      </div>

      <BlackBar onClick={() => setPhrase(true)} icon={P.wc} title="화장실이 어디예요?" sub="중국어로 크게 보여주기" />
      {phrase && (
        <button onClick={() => setPhrase(false)} aria-label="닫기" style={{ position: 'fixed', inset: 0, zIndex: 70, background: '#fff', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <span className="zh" lang="zh-CN" style={{ fontSize: 'min(11vw, 56px)', fontWeight: 800, textAlign: 'center', padding: '0 16px' }}>请问厕所在哪里？</span>
          <span style={{ fontSize: 16, color: 'var(--muted)' }}>실례지만 화장실이 어디예요?</span>
        </button>
      )}
    </main>
  );
}
