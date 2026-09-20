'use client';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deleteBlock, logChange, reorderBlocks, restoreBlock, updateBlock, useBlocks, useDays, useMe } from '@/lib/data';
import { Icon, P, TYPE_PATHS } from '@/lib/icons';
import { fromMin, nowMin, todayISO, toMin } from '@/lib/time';
import type { AiOption, Block } from '@/lib/types';
import { TopBar, useToast } from '@/components/ui';
import BlockSheet from '@/components/BlockSheet';
import EditList from '@/components/EditList';
import AiCard from '@/components/AiCard';

type Ai = { heading: string; sub: string; loading: boolean; error: string | null; options: AiOption[] };

function DayView() {
  const n = Number(useParams().n);
  const forceLate = useSearchParams().get('late') === '1';
  const router = useRouter();
  const { me } = useMe();
  const toast = useToast();
  const { data: days } = useDays();
  const day = days?.find((d) => d.n === n);
  const { data: blocks, refresh } = useBlocks(day?.id);
  const [focus, setFocus] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);
  const [ai, setAi] = useState<Ai | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const press = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { if (me === null) router.replace('/'); }, [me, router]);

  // 처음 초점: 지금 시간에 가장 가까운 블록
  useEffect(() => {
    if (!blocks?.length || focus) return;
    const now = nowMin();
    const cur = blocks.find((b) => (toMin(b.start_time) ?? 0) + (b.duration_min ?? 60) > now) ?? blocks[0];
    setFocus(cur.id);
  }, [blocks, focus]);

  // 스크롤이 멈추면 화면 가운데에 가장 가까운 블록을 키움
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const mid = window.innerHeight / 2;
        let best: string | null = null; let dist = Infinity;
        listRef.current?.querySelectorAll<HTMLElement>('[data-id]').forEach((el) => {
          const r = el.getBoundingClientRect();
          const d = Math.abs(r.top + r.height / 2 - mid);
          if (d < dist) { dist = d; best = el.dataset.id!; }
        });
        if (best) setFocus(best);
      }, 140);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(t); };
  }, []);

  const tap = (id: string) => {
    setFocus(id);
    requestAnimationFrame(() => listRef.current?.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  // 이동 시간 채우기 (좌표가 있는 이웃 블록끼리, 한 번만)
  const filling = useRef(new Set<string>());
  useEffect(() => {
    if (!blocks || !day) return;
    blocks.forEach((b, i) => {
      const prev = blocks[i - 1];
      if (!prev || b.travel?.fromId === prev.id || !prev.lng || !b.lng || filling.current.has(b.id + prev.id)) return;
      filling.current.add(b.id + prev.id);
      fetch(`/api/amap/route?from=${prev.lng},${prev.lat}&to=${b.lng},${b.lat}&city=${encodeURIComponent(day.city)}`)
        .then((r) => r.json())
        .then((j) => { if (!j.error) updateBlock(b.id, { travel: { fromId: prev.id, mode: j.mode, minutes: j.minutes, text: j.text } }); })
        .catch(() => {});
    });
  }, [blocks, day]);

  // ---------- AI ----------
  const askAi = useCallback(async (mode: 'reflow' | 'late', list: Block[], extra: { removed?: string; moved?: string }, heading: string, sub: string) => {
    if (!day) return;
    setAi({ heading, sub, loading: true, error: null, options: [] });
    try {
      const r = await fetch('/api/ai', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode, dayN: day.n, city: day.city, now: fromMin(nowMin()), ...extra,
          blocks: list.map((b) => ({ id: b.id, name: b.name, type: b.type, start_time: b.start_time, duration_min: b.duration_min, note: b.note, reserved: !!b.reservation, travel_min: b.travel?.minutes ?? null })),
        }),
      });
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      setAi({ heading, sub, loading: false, error: null, options: j.options });
    } catch (e) {
      setAi({ heading, sub, loading: false, error: e instanceof Error ? e.message : 'AI가 답하지 못했어요', options: [] });
    }
  }, [day]);

  const apply = async (o: AiOption) => {
    try {
      for (const c of o.changes) {
        if (c.remove) await deleteBlock(c.id);
        else await updateBlock(c.id, { ...(c.start_time ? { start_time: c.start_time } : {}), ...(c.duration_min ? { duration_min: c.duration_min } : {}) });
      }
      await logChange(day!.n, o.summary);
      setAi(null);
      refresh();
      toast({ text: '반영했어요 · 가족에게 알림을 보냈어요' });
    } catch (e) { toast({ text: e instanceof Error ? e.message : '바꾸지 못했어요' }); }
  };

  // 아침 10시 전 첫 접속 + 첫 일정 시작 지남
  const lateChecked = useRef(false);
  useEffect(() => {
    if (!day || !blocks?.length || lateChecked.current) return;
    lateChecked.current = true;
    const key = 'late.' + todayISO();
    const first = toMin(blocks[0].start_time);
    const now = nowMin();
    const ok = forceLate || (day.date === todayISO() && now < 600 && !localStorage.getItem(key) && first != null && now > first);
    if (!ok) return;
    localStorage.setItem(key, '1');
    askAi('late', blocks, {}, `첫 일정 ${blocks[0].name}(${blocks[0].start_time})보다 ${first != null ? now - first : 0}분 늦었어요`, '좋은 아침이에요 · 장소별 특이사항을 보고 맞춰봤어요');
  }, [day, blocks, forceLate, askAi]);

  const onRemove = async (b: Block) => {
    try {
      await deleteBlock(b.id);
      await logChange(day!.n, `${b.name} 빠짐`);
      refresh();
      toast({ text: `${b.name}을(를) 뺐어요`, action: { label: '되돌리기', run: async () => { await restoreBlock(b); await logChange(day!.n, `${b.name} 다시 넣음`); refresh(); setAi(null); } } });
      const rest = (blocks ?? []).filter((x) => x.id !== b.id);
      askAi('reflow', rest, { removed: b.name }, '이렇게 바꿔볼까요?', '예약된 일정은 그대로 두고 짰어요');
    } catch (e) { toast({ text: e instanceof Error ? e.message : '빼지 못했어요' }); }
  };
  const onReorder = async (ids: string[], moved: Block) => {
    await reorderBlocks(ids);
    await logChange(day!.n, `${moved.name} 순서 바꿈`);
    refresh();
    const byId = new Map((blocks ?? []).map((b) => [b.id, b]));
    askAi('reflow', ids.map((id) => byId.get(id)!).filter(Boolean), { moved: moved.name }, '순서에 맞춰 시간을 정리할까요?', '예약된 일정은 그대로 두고 짰어요');
  };

  const sheetBlock = useMemo(() => blocks?.find((b) => b.id === sheetId) ?? null, [blocks, sheetId]);
  const focusIdx = blocks?.findIndex((b) => b.id === focus) ?? -1;
  const fade = (i: number) => { const d = Math.abs(i - focusIdx); return d === 0 ? 1 : d === 1 ? 0.85 : d === 2 ? 0.5 : 0.25; };

  if (!day) return <main className="page"><TopBar back="/trip" /><p className="empty">불러오는 중…</p></main>;

  return (
    <main className="page">
      <div style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10, paddingBottom: 10 }}>
        <TopBar back="/trip" right={<>
          <Link href="/toilet" className="icon-btn" aria-label="근처 화장실"><Icon d={P.wc} size={22} /></Link>
          <Link href={`/add?day=${day.n}`} className="icon-btn sky" aria-label="일정 추가"><Icon d={P.plus} size={18} stroke={2} /></Link>
        </>} />
        <div className="head" style={{ paddingLeft: 20 }}>
          <h1>D{day.n} {day.title}</h1>
          <div className="meta"><span>{day.city}</span><span className="dot" /><span>블록 {blocks?.length ?? 0}개</span></div>
        </div>
      </div>

      {edit && blocks ? (
        <EditList blocks={blocks} onRemove={onRemove} onReorder={onReorder} onDone={() => setEdit(false)} />
      ) : (
        <div className="tl" ref={listRef}>
          {blocks?.length === 0 && <p className="empty">아직 블록이 없어요. 오른쪽 위 + 로 첫 일정을 넣어보세요.</p>}
          {blocks?.map((b, i) => (
            <div key={b.id}>
              {i > 0 && (
                <div className="tl-gap" style={{ opacity: Math.max(fade(i), fade(i - 1)) }}>
                  {b.travel?.fromId === blocks[i - 1].id ? <><Icon d={b.travel.mode === 'walk' ? P.walk : b.travel.mode === 'taxi' ? P.car : P.subway} size={13} stroke={2} color="var(--sky-deep)" />{b.travel.text}</> : ' '}
                </div>
              )}
              <div data-id={b.id}
                onPointerDown={() => { press.current = setTimeout(() => { setEdit(true); navigator.vibrate?.(20); }, 500); }}
                onPointerUp={() => clearTimeout(press.current)} onPointerLeave={() => clearTimeout(press.current)} onPointerCancel={() => clearTimeout(press.current)}
                onContextMenu={(e) => e.preventDefault()}>
                {b.id === focus ? (
                  <div className="tl-focus">
                    <button className="tl-card" onClick={() => setSheetId(b.id)}>
                      <span className="circle"><Icon d={TYPE_PATHS[b.type]} size={22} /></span>
                      <span className="txt">
                        <small>{b.start_time ?? '시간 미정'}{b.reservation ? ` · 예약 ${b.reservation.owner ?? ''}` : ''}</small>
                        <b>{b.name}{b.important && <span className="star"> ★</span>}</b>
                        {b.memo && <span>{b.memo}</span>}
                      </span>
                      <Icon d={P.chev} size={18} color="#9a9aa0" stroke={2} />
                    </button>
                  </div>
                ) : (
                  <button className="tl-item" style={{ opacity: fade(i) }} onClick={() => tap(b.id)}>
                    <span className="circle"><Icon d={TYPE_PATHS[b.type]} size={19} /></span>
                    <span className="txt"><small>{b.start_time ?? '시간 미정'}</small><b>{b.name}</b></span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!edit && !ai && blocks && blocks.length > 1 && (
        <div style={{ position: 'fixed', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ fontSize: 12, color: '#fff', background: 'var(--ink)', padding: '9px 14px', borderRadius: 999 }}>길게 눌러 끌면 순서를 바꿀 수 있어요</span>
        </div>
      )}

      {sheetBlock && <BlockSheet key={sheetBlock.id} block={sheetBlock} day={day} onClose={() => setSheetId(null)} />}
      {ai && <AiCard {...ai} dayN={day.n} onApply={apply} onClose={() => setAi(null)} />}
    </main>
  );
}

export default function Page() {
  return <Suspense><DayView /></Suspense>;
}
