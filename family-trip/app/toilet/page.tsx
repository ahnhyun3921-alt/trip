'use client';
import { useMemo, useState } from 'react';
import { amapSearch, getHere } from '@/lib/geo';
import { Icon, P, TYPE_PATHS } from '@/lib/icons';
import { GATE_LABEL, MetroStation, searchStations } from '@/lib/metro-toilets';
import { BlackBar, TopBar } from '@/components/ui';

const FINDS = [
  { id: 'toilet', label: '공중화장실', kw: '厕所' },
  { id: 'metro', label: '지하철역', kw: '地铁站' },
  { id: 'mall', label: '쇼핑몰', kw: '商场' },
  { id: 'fastfood', label: '패스트푸드', kw: '肯德基' },
];

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
  const [here, setHere] = useState<[number, number] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [phrase, setPhrase] = useState(false);
  const [q, setQ] = useState('');
  const stations = useMemo(() => searchStations(q), [q]);

  // 위치를 알면 그 자리 기준으로, 몰라도 고덕지도에서 바로 찾을 수 있어요
  const open = async (kw: string) => {
    let center = here;
    if (!center) {
      try { center = await getHere(); setHere(center); }
      catch (e) { setErr(e instanceof Error ? e.message : '위치를 못 받았어요 · 고덕지도에서 직접 찾아요'); }
    }
    window.open(amapSearch(kw, center ?? undefined), '_blank');
  };

  return (
    <main className="page">
      <TopBar back="/trip" />
      <div className="head">
        <h1 className="big">근처 화장실</h1>
        <div className="meta"><span>고덕지도에서 지금 자리 기준으로 찾아요</span></div>
      </div>

      <div className="rows" style={{ marginTop: 18 }}>
        {FINDS.map((f) => (
          <button key={f.id} className="row" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }} onClick={() => open(f.kw)}>
            <span className="circle"><Icon d={f.id === 'toilet' ? P.wc : f.id === 'metro' ? P.subway : f.id === 'mall' ? P.pin : TYPE_PATHS.food} size={19} /></span>
            <span className="txt"><b>{f.label} 찾기</b><span className="zh" lang="zh-CN">{f.kw}</span></span>
            <Icon d={P.out} size={18} color="#9a9aa0" stroke={2} />
          </button>
        ))}
      </div>
      {err && <p className="err">{err}</p>}

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
        {stations.length === 0 && <p className="empty" style={{ padding: '8px 0' }}>목록에 없는 역이에요. 위의 지하철역 찾기로 고덕지도에서 봐주세요.</p>}
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
