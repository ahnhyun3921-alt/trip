'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { updateBlock, useBlocks, useDays, useMe } from '@/lib/data';
import { memberByName } from '@/lib/members';
import { Face, Icon, P } from '@/lib/icons';
import { dateLabel, nowMin, todayISO, toMin } from '@/lib/time';
import { toKrw, useFx } from '@/lib/fx';
import type { Block } from '@/lib/types';

// 지금 하고 있는 블록과 다음 블록
function nowAndNext(blocks: Block[]) {
  const n = nowMin();
  for (let i = 0; i < blocks.length; i++) {
    const s = toMin(blocks[i].start_time);
    if (s == null) continue;
    const e = s + (blocks[i].duration_min ?? 60);
    if (n >= s && n < e) return { cur: blocks[i], next: blocks[i + 1] ?? null };
    if (n < s) return { cur: null, next: blocks[i] };
  }
  return { cur: null, next: null };
}

export default function Today() {
  const router = useRouter();
  const { me } = useMe();
  const { data: days } = useDays();
  const { fx } = useFx();
  const [yuan, setYuan] = useState('');
  useEffect(() => { if (me === null) router.replace('/'); }, [me, router]);

  const today = todayISO();
  const idx = days?.findIndex((d) => d.date === today) ?? -1;
  const inTrip = idx >= 0;
  const first = days?.[0];
  const day = inTrip ? days![idx] : first;
  const { data: blocks } = useBlocks(day?.id);
  const meM = memberByName(me);

  const daysLeft = useMemo(() => {
    if (!first?.date) return null;
    const a = new Date(today + 'T00:00:00').getTime();
    const b = new Date(first.date + 'T00:00:00').getTime();
    return Math.round((b - a) / 86400000);
  }, [first, today]);

  const { cur, next } = useMemo(() => (inTrip ? nowAndNext(blocks ?? []) : { cur: null, next: blocks?.[0] ?? null }), [blocks, inTrip]);
  const focus = cur ?? next;
  const todos = useMemo(() => (blocks ?? []).flatMap((b) => b.todos.filter((t) => !t.done).map((t) => ({ ...t, block: b })))
    .sort((x, y) => (x.time ?? '99:99').localeCompare(y.time ?? '99:99')), [blocks]);

  const title = inTrip ? (day?.title || '오늘') : daysLeft != null && daysLeft > 0 ? `여행까지 ${daysLeft}일` : '즐거웠던 여행';

  return (
    <main className="page">
      <div className="top" style={{ paddingLeft: 24 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
          {day ? [dateLabel(day.date), `D${day.n}`, day.city].filter(Boolean).join(' · ') : ''}
        </span>
        <Link href="/?switch=1" className="icon-btn filled" aria-label={`${me ?? ''} · 사람 바꾸기`}>{meM && <Face d={meM.face} size={28} />}</Link>
      </div>
      <div className="head"><h1 className="big" style={{ fontSize: 34 }}>{title}</h1></div>

      {focus ? (
        <section className="now-card" aria-label={cur ? '지금 일정' : '다음 일정'}>
          <span className="label">{cur ? <><span className="live" />지금</> : inTrip ? `다음 · ${focus.start_time ?? ''}` : `D${day?.n} 첫 일정 · ${focus.start_time ?? ''}`}</span>
          <h2>{focus.name}</h2>
          {(focus.memo || (cur && next)) && (
            <span className="sub">{cur && next ? `다음은 ${next.name}${next.start_time ? ' ' + next.start_time : ''}${next.travel?.text ? ' · ' + next.travel.text : ''}` : focus.memo}</span>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {inTrip ? (
              <>
                <Link href={`/move/${(next ?? focus).id}`} className="btn light" style={{ flex: 1 }}><Icon d={P.pin} size={18} />이동하기</Link>
                <Link href={`/taxi/${(next ?? focus).id}`} className="btn ghost-dark" style={{ flex: 1 }}><Icon d={P.car} size={18} />택시 카드</Link>
              </>
            ) : (
              <Link href={day ? `/day/${day.n}` : '/trip'} className="btn light" style={{ flex: 1 }}>일정 보러 가기</Link>
            )}
          </div>
        </section>
      ) : (
        <section className="now-card"><span className="label">오늘 일정이 비어 있어요</span><Link href="/trip" className="btn light">일정 보러 가기</Link></section>
      )}

      <div className="sec-h"><span><b style={{ color: 'var(--ink)' }}>바로</b>쓰기</span></div>
      <div className="tools">
        <Link href="/cards" className="tool"><Icon d={P.chat} size={22} /><span><b style={{ display: 'block', color: 'var(--ink)' }}>중국어 카드</b>알레르기 · 주문 · 길</span></Link>
        <Link href="/toilet" className="tool"><Icon d={P.wc} size={22} /><span><b style={{ display: 'block', color: 'var(--ink)' }}>화장실</b>근처 찾기</span></Link>
        <Link href={focus ? `/taxi/${(next ?? focus).id}` : '/cards'} className="tool"><Icon d={P.car} size={22} /><span><b style={{ display: 'block', color: 'var(--ink)' }}>기사님 카드</b>{focus ? `${(next ?? focus).name}까지` : '주소 보여주기'}</span></Link>
        <Link href="/wish" className="tool"><Icon d={P.bag} size={22} /><span><b style={{ display: 'block', color: 'var(--ink)' }}>사갈 것</b>편의점 · 기념품</span></Link>
      </div>

      <section aria-label="환율 계산" style={{ margin: '12px 20px 0', background: 'var(--surface)', borderRadius: 22, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <label className="sr" htmlFor="today-yuan">위안 금액</label>
        <input id="today-yuan" inputMode="decimal" value={yuan} onChange={(e) => setYuan(e.target.value.replace(/[^\d.]/g, ''))} placeholder="¥ 얼마?"
          style={{ width: 110, minHeight: 44, border: 'none', borderRadius: 12, padding: '0 12px', background: '#fff', fontSize: 16 }} />
        <span style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>{fx && yuan ? `≈ ₩ ${toKrw(Number(yuan), fx.rate).toLocaleString()}` : '≈ ₩'}</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fx ? `¥1 = ₩${fx.rate.toFixed(0)}` : ''}</span>
      </section>

      {inTrip && todos.length > 0 && (
        <>
          <div className="sec-h"><span><b style={{ color: 'var(--ink)' }}>오늘</b>할 일</span><span className="count">{todos.length}</span></div>
          <div className="rows">
            {todos.map((t) => (
              <button key={t.block.id + t.id} className="row" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
                onClick={() => updateBlock(t.block.id, { todos: t.block.todos.map((x) => (x.id === t.id ? { ...x, done: true } : x)) })}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid #bdbdc2', flexShrink: 0 }} />
                <span className="txt"><b>{t.time && <span style={{ color: 'var(--accent-text)', marginRight: 6 }}>{t.time}</span>}{t.text}</b><span>{t.block.name}</span></span>
              </button>
            ))}
          </div>
        </>
      )}

      {inTrip && (day?.snacks?.length ?? 0) > 0 && (
        <>
          <div className="sec-h"><span><b style={{ color: 'var(--ink)' }}>오늘</b>군것질</span></div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 24px', scrollbarWidth: 'none' }}>
            {day!.snacks.map((s) => (
              <Link key={s.id} href={`/day/${day!.n}`} style={{ flexShrink: 0, minHeight: 40, padding: '0 14px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, background: s.done ? 'var(--accent-tint)' : 'var(--surface)', color: s.done ? 'var(--accent-text)' : 'var(--text)', textDecoration: s.done ? 'line-through' : 'none' }}>
                {s.brand && <span className="zh" style={{ fontSize: 11, color: 'var(--muted)' }}>{s.brand}</span>}{s.ko}
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
