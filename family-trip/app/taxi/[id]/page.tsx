'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useBlock, useDays } from '@/lib/data';
import { amapNav, DIDI_APP } from '@/lib/geo';
import { Icon, P } from '@/lib/icons';
import { BlackBar, TopBar, useToast } from '@/components/ui';

export default function Taxi() {
  const id = String(useParams().id);
  const { data: b } = useBlock(id);
  const { data: days } = useDays();
  const day = days?.find((d) => d.id === b?.day_id);
  const [toHotel, setToHotel] = useState(false);
  const [big, setBig] = useState(false);
  const toast = useToast();
  if (!b) return <main className="page"><TopBar back="/trip" /><p className="empty">불러오는 중…</p></main>;

  const hotel = day?.hotel;
  const dest = toHotel && hotel
    ? { ko: hotel.name, zh: hotel.zhName || hotel.name, addr: hotel.zhAddress ?? '', lng: hotel.lng, lat: hotel.lat }
    : { ko: b.name, zh: b.zh_name || b.name, addr: b.zh_address ?? '', lng: b.lng, lat: b.lat };
  const copy = () => navigator.clipboard.writeText(`${dest.zh} ${dest.addr}`.trim()).then(() => toast({ text: '중국어 주소를 복사했어요', ms: 2000 }));

  return (
    <main className="page">
      <TopBar back={`/move/${b.id}`} />
      <div className="head">
        <h1>택시 부르기</h1>
        <div className="meta"><span>{dest.ko}까지</span></div>
      </div>
      <section aria-label="기사님께 보여줄 주소" style={{ margin: '22px 20px 0', background: 'var(--surface)', borderRadius: 26, padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span lang="zh-CN" className="zh" style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>请带我去这里</span>
        <span lang="zh-CN" className="zh" style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15 }}>{dest.zh}</span>
        {dest.addr && <span lang="zh-CN" className="zh" style={{ fontSize: 17, color: 'var(--text)' }}>{dest.addr}</span>}
        <span style={{ height: 1, background: '#e2e2e5', margin: '6px 0' }} />
        <span style={{ fontSize: 14, color: 'var(--muted)' }}>{dest.ko}(으)로 가주세요</span>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button className="btn small" style={{ flex: 1, background: '#fff', color: 'var(--ink)' }} onClick={copy}>주소 복사</button>
          <button className="btn small" style={{ flex: 1, background: '#fff', color: 'var(--ink)' }} onClick={() => setBig(true)}>크게 보여주기</button>
        </div>
      </section>

      <div className="sec-h"><span><b style={{ color: 'var(--ink)' }}>부를</b>앱</span></div>
      <div className="rows">
        <a className="row" href={DIDI_APP} onClick={copy}>
          <span className="circle"><Icon d={P.car} size={19} /></span>
          <span className="txt"><b>디디</b><span>주소를 복사해 두니 목적지에 붙여넣으세요</span></span>
          <Icon d={P.out} size={18} color="#9a9aa0" stroke={2} />
        </a>
        {dest.lng && dest.lat && (
          <a className="row" href={amapNav({ lng: dest.lng, lat: dest.lat, name: dest.zh }, 'car')} target="_blank" rel="noreferrer">
            <span className="circle"><Icon d={P.map} size={19} /></span>
            <span className="txt"><b>고덕지도 택시</b><span>목적지가 채워진 채로 열려요 · 打车 누르기</span></span>
            <Icon d={P.out} size={18} color="#9a9aa0" stroke={2} />
          </a>
        )}
      </div>

      {hotel && (
        <BlackBar onClick={() => setToHotel((v) => !v)} icon={toHotel ? P.pin : P.hotel}
          title={toHotel ? `${b.name}(으)로 가기` : '호텔로 돌아가기'} sub={toHotel ? '목적지 카드로 바꾸기' : `${hotel.name} 주소 카드로 바꾸기`} />
      )}

      {big && (
        <button onClick={() => setBig(false)} aria-label="닫기" style={{ position: 'fixed', inset: 0, zIndex: 70, background: '#fff', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
          <span className="zh" lang="zh-CN" style={{ fontSize: 28, fontWeight: 600 }}>请带我去这里</span>
          <span className="zh" lang="zh-CN" style={{ fontSize: 'min(14vw, 64px)', fontWeight: 800, lineHeight: 1.1, textAlign: 'center' }}>{dest.zh}</span>
          {dest.addr && <span className="zh" lang="zh-CN" style={{ fontSize: 24, textAlign: 'center' }}>{dest.addr}</span>}
          <span style={{ fontSize: 14, color: 'var(--muted)', marginTop: 20 }}>누르면 닫혀요</span>
        </button>
      )}
    </main>
  );
}
