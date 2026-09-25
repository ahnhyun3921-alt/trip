'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useBlocks, useDays, useMe } from '@/lib/data';
import { memberByName } from '@/lib/members';
import { Face, Icon, P } from '@/lib/icons';
import { dateLabel, nowMin, todayISO, toMin } from '@/lib/time';
import { toKrw, useFx } from '@/lib/fx';
import { BlackBar } from '@/components/ui';
import type { Block } from '@/lib/types';

const LINES = ['오늘도 많이 걷자!', '밀크티 한 잔 하고 갈까?', '오늘은 뭐 먹지?', '만두 먹으러 가자', '길 잃어도 괜찮아', '천천히 가도 돼', '발 아파도 즐거워', '탕후루 몇 개 먹을까', '사진 많이 찍자', '물 마셨어?', '휴지 챙겼지?', '오늘도 잘 먹어보자', '다 같이 가자~', '잠깐 쉬었다 갈까?'];

export default function Trip() {
  const router = useRouter();
  const { me } = useMe();
  const { data: days, error } = useDays();
  const [idx, setIdx] = useState<number | null>(null);
  const tilesRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (me === null) router.replace('/'); }, [me, router]);

  const todayIdx = useMemo(() => days?.findIndex((d) => d.date === todayISO()) ?? -1, [days]);
  useEffect(() => { if (days && idx == null) setIdx(Math.max(0, todayIdx)); }, [days, idx, todayIdx]);

  // 선택된 타일을 가운데로
  useEffect(() => {
    if (idx == null) return;
    const el = tilesRef.current?.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [idx]);

  const day = days && idx != null ? days[idx] : undefined;
  const { data: blocks } = useBlocks(day?.id);
  const today = todayIdx >= 0 ? days![todayIdx] : undefined;
  const { data: todayBlocks } = useBlocks(today?.id);

  const important = useMemo(() => {
    const list: { icon: string; text: string; sub?: string }[] = [];
    day?.moves?.forEach((m) => list.push({ icon: P[m.kind], text: m.text }));
    blocks?.filter((b) => b.reservation || b.important).forEach((b) => list.push({
      icon: b.reservation ? P.ticket : P.star,
      text: `${b.name}${b.start_time ? ' ' + b.start_time : ''}`,
      sub: b.reservation?.owner ? `예약 · ${b.reservation.owner}` : undefined,
    }));
    return list;
  }, [day, blocks]);

  const now = useMemo(() => nowBlock(todayBlocks ?? []), [todayBlocks]);
  const meM = memberByName(me);
  const { fx, error: fxError, setManual } = useFx();
  const [yuan, setYuan] = useState('');
  const [line, setLine] = useState(LINES[0]);
  useEffect(() => { setLine(LINES[Math.floor(Math.random() * LINES.length)]); }, []);

  return (
    <main className="page">
      <div className="top">
        <Link href="/spend" className="icon-btn" aria-label="지출 기록"><Icon d={P.receipt} size={22} /></Link>
        <div className="right">
          <Link href="/wish" className="icon-btn" aria-label="사갈 것·먹을 것"><Icon d={P.bag} size={22} /></Link>
          <Link href="/cards" className="icon-btn" aria-label="중국어 카드"><Icon d={P.chat} size={22} /></Link>
          <Link href="/toilet" className="icon-btn" aria-label="근처 화장실"><Icon d={P.wc} size={22} /></Link>
          <Link href={`/add${day ? `?day=${day.n}` : ''}`} className="icon-btn" aria-label="일정 추가"><Icon d={P.plus} size={22} stroke={1.9} /></Link>
          <Link href="/?switch=1" className="icon-btn filled" aria-label={`${me ?? ''} · 사람 바꾸기`}>{meM && <Face d={meM.face} size={28} />}</Link>
        </div>
      </div>
      <div className="head">
        <h1 className="big">{line}</h1>
        <div className="meta"><span>상하이 · 항저우</span><span className="dot" /><span>{days?.length ?? 0}일</span><span className="dot" /><span>{me}</span></div>
      </div>
      {error && !days && <p className="err">{error}</p>}

      <section aria-label="환율" style={{ margin: '20px 24px 0', background: 'var(--surface)', borderRadius: 22, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{fx ? `¥ 1 = ₩ ${fx.rate.toFixed(1)}` : '환율 불러오는 중…'}</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fx ? (fx.manual ? '직접 적은 환율' : `${fx.date} 기준`) : ''}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label className="sr" htmlFor="yuan">위안 금액</label>
          <input id="yuan" inputMode="decimal" value={yuan} onChange={(e) => setYuan(e.target.value.replace(/[^\d.]/g, ''))} placeholder="¥ 얼마?"
            style={{ width: 120, minHeight: 44, border: 'none', borderRadius: 12, padding: '0 12px', background: '#fff', fontSize: 16 }} />
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            {fx && yuan ? `≈ ₩ ${toKrw(Number(yuan), fx.rate).toLocaleString()}` : '≈ ₩'}
          </span>
        </div>
        {!fx && fxError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label className="sr" htmlFor="rate">환율 직접 넣기</label>
            <input id="rate" inputMode="decimal" placeholder="예: 190" onKeyDown={(e) => { if (e.key === 'Enter') setManual(Number((e.target as HTMLInputElement).value)); }}
              style={{ width: 110, minHeight: 40, border: 'none', borderRadius: 12, padding: '0 12px', background: '#fff', fontSize: 15 }} />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fxError} · 직접 넣고 Enter</span>
          </div>
        )}
      </section>

      <div className="sec-h"><span><b style={{ color: 'var(--ink)' }}>날짜별</b>일정</span><span className="count">{day ? `D${day.n} / ${days!.length}` : ''}</span></div>
      <div className="tiles" ref={tilesRef}>
        {days?.map((d, i) => (
          <button key={d.id} className={`tile${i === idx ? ' on' : ''}`} aria-pressed={i === idx}
            onClick={() => (i === idx ? router.push(`/day/${d.n}`) : setIdx(i))}>
            <span className="box"><span className="inner"><small>DAY</small><strong>{d.n}</strong></span></span>
            <span className="cap"><b>{d.title || d.city}</b><span>{[dateLabel(d.date), d.city].filter(Boolean).join(' · ')}{false ? ' · 누르면 열려요' : ''}</span></span>
          </button>
        ))}
      </div>

      {day && (
        <>
          <div className="sec-h" style={{ paddingTop: 10 }}><span><b style={{ color: 'var(--ink)' }}>D{day.n}</b>중요한 것</span></div>
          <div className="rows">
            {important.length === 0 && <p className="empty" style={{ padding: '8px 0' }}>블록에 중요 표시나 예약을 넣으면 여기 모여요</p>}
            {important.map((x, i) => (
              <div className="row" key={i}>
                <span className="circle"><Icon d={x.icon} size={18} /></span>
                <span className="txt"><b>{x.text}</b>{x.sub && <span>{x.sub}</span>}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {now && (
        <BlackBar href={`/move/${(now.next ?? now.cur)!.id}`} icon={P.pin}
          title={now.cur ? `지금 · ${now.cur.name}` : `다음 · ${now.next!.name}`}
          sub={now.next ? `${now.cur ? '다음 ' : ''}${now.next.name}${now.next.start_time ? ' ' + now.next.start_time : ''}${now.next.travel?.text ? ' · ' + now.next.travel.text : ''}` : '오늘 마지막 일정'}
          progress={now.progress} />
      )}
    </main>
  );
}

function nowBlock(blocks: Block[]) {
  if (!blocks.length) return null;
  const n = nowMin();
  for (let i = 0; i < blocks.length; i++) {
    const s = toMin(blocks[i].start_time);
    if (s == null) continue;
    const e = s + (blocks[i].duration_min ?? 60);
    if (n >= s && n < e) return { cur: blocks[i], next: blocks[i + 1] ?? null, progress: (n - s) / (e - s) };
    if (n < s) return { cur: null, next: blocks[i], progress: undefined };
  }
  return null;
}
