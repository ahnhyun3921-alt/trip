'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { currentMe, deleteBlock, logChange, reorderBlocks, restoreBlock, updateDay, useBlocks, useDays, useMe } from '@/lib/data';
import { Icon, P, TYPE_PATHS } from '@/lib/icons';
import { dateLabel, fromMin, nowMin, toMin } from '@/lib/time';
import type { Block, Snack } from '@/lib/types';
import { Confirm, TopBar, useToast } from '@/components/ui';
import BlockSheet from '@/components/BlockSheet';
import EditList from '@/components/EditList';

function DayView() {
  const n = Number(useParams().n);
  const router = useRouter();
  const { me } = useMe();
  const toast = useToast();
  const { data: days } = useDays();
  const day = days?.find((d) => d.n === n);
  const { data: blocks, refresh } = useBlocks(day?.id);
  const [focus, setFocus] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<Block | null>(null);
  const [editKey, setEditKey] = useState(0);
  const [rename, setRename] = useState<string | null>(null);
  const [renameCity, setRenameCity] = useState('');
  const [snackText, setSnackText] = useState('');
  const [snackBrand, setSnackBrand] = useState('');
  const [addSnack, setAddSnack] = useState(false);
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

  // 빼기: "정말 뺄까요?" 확인 → 반영 + 가족 알림 (되돌리기 가능)
  const onRemove = (b: Block) => setPendingRemove(b);
  const confirmRemove = async () => {
    const b = pendingRemove!;
    setPendingRemove(null);
    try {
      await deleteBlock(b.id);
      await logChange(day!.n, `${b.name} 빠짐`);
      refresh();
      toast({ text: `${b.name}을(를) 뺐어요 · 가족에게 알림을 보냈어요`, action: { label: '되돌리기', run: async () => { await restoreBlock(b); await logChange(day!.n, `${b.name} 다시 넣음`); refresh(); setEditKey((k) => k + 1); } } });
    } catch (e) { toast({ text: e instanceof Error ? e.message : '빼지 못했어요' }); }
  };
  const cancelRemove = () => { setPendingRemove(null); setEditKey((k) => k + 1); };
  const onReorder = async (ids: string[], moved: Block) => {
    try {
      await reorderBlocks(ids);
      await logChange(day!.n, `${moved.name} 순서 바꿈`);
      refresh();
      toast({ text: `${moved.name} 순서를 바꿨어요 · 가족에게 알림을 보냈어요` });
    } catch (e) { toast({ text: e instanceof Error ? e.message : '순서를 바꾸지 못했어요' }); }
  };

  const saveDay = () => {
    if (!day || rename === null) return;
    const title = rename.trim();
    const city = renameCity.trim() || day.city;
    updateDay(day.id, { title, city })
      .then(() => logChange(day.n, `D${day.n} 이름·장소를 ${title || city}(으)로 바꿈`))
      .then(() => toast({ text: `D${day.n}를 '${[title, city].filter(Boolean).join(' · ')}'로 바꿨어요 · 가족에게 알림을 보냈어요` }))
      .catch((e) => toast({ text: e.message }));
  };

  const snacks = day?.snacks ?? [];
  const setSnacks = (next: Snack[]) => day && updateDay(day.id, { snacks: next }).catch((e) => toast({ text: e.message }));
  const toggleSnack = (id: string) => setSnacks(snacks.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  const saveSnack = () => {
    const text = snackText.trim();
    if (!text) { setAddSnack(false); return; }
    const delivery = /배달|시켜|메이퇀/.test(text);
    setSnacks([...snacks, { id: Math.random().toString(36).slice(2, 8), ko: text.replace(/\s*배달$/, ''), brand: snackBrand.trim() || undefined, delivery, by: currentMe() ?? undefined }]);
    setSnackText(''); setSnackBrand(''); setAddSnack(false);
    toast({ text: `${text} 붙였어요`, ms: 2500 });
  };

  const summary = useMemo(() => {
    const list = blocks ?? [];
    const starts = list.map((b) => toMin(b.start_time)).filter((v): v is number => v != null);
    const ends = list.map((b) => { const s = toMin(b.start_time); return s == null ? null : s + (b.duration_min ?? 60); }).filter((v): v is number => v != null);
    const travelMin = list.reduce((sum, b) => sum + (b.travel?.minutes ?? 0), 0);
    return {
      startEnd: starts.length ? `${fromMin(Math.min(...starts))} 출발 → ${fromMin(Math.max(...ends))} 마무리` : '시간 미정',
      travelMin,
      travelText: travelMin >= 60 ? `${Math.floor(travelMin / 60)}시간 ${travelMin % 60}분` : `${travelMin}분`,
      reserved: list.filter((b) => b.reservation).length,
    };
  }, [blocks]);

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
          {rename === null ? (
            <button onClick={() => { setRename(day.title); setRenameCity(day.city); }} style={{ border: 'none', background: 'transparent', padding: 0, display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
              <h1>D{day.n} {day.title}</h1>
              <Icon d={P.pencil} size={16} color="#9a9aa0" />
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, paddingRight: 20, flexWrap: 'wrap' }}>
              <label className="sr" htmlFor="day-title">날 이름</label>
              <input id="day-title" autoFocus value={rename} onChange={(e) => setRename(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { saveDay(); setRename(null); } if (e.key === 'Escape') setRename(null); }}
                style={{ flexGrow: 1, minHeight: 44, borderRadius: 12, border: '1px solid var(--line)', padding: '0 12px', fontSize: 18, fontWeight: 700 }} />
              <label className="sr" htmlFor="day-city">장소</label>
              <input id="day-city" value={renameCity} onChange={(e) => setRenameCity(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { saveDay(); setRename(null); } if (e.key === 'Escape') setRename(null); }}
                placeholder="장소 (예: 항저우)" style={{ width: 130, minHeight: 44, borderRadius: 12, border: '1px solid var(--line)', padding: '0 12px', fontSize: 15 }} />
              <button className="btn small" onClick={() => { saveDay(); setRename(null); }}>저장</button>
            </div>
          )}
          <div className="meta"><span>{dateLabel(day.date) || day.city}</span><span className="dot" /><span>{dateLabel(day.date) ? day.city : `블록 ${blocks?.length ?? 0}개`}</span>{dateLabel(day.date) && <><span className="dot" /><span>블록 {blocks?.length ?? 0}개</span></>}</div>
        </div>
      </div>

      {!edit && (
        <div style={{ padding: '0 0 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px 10px', fontSize: 13, color: 'var(--muted)', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{summary.startEnd}</span>
            <span className="dot" /><span>{blocks?.length ?? 0}곳</span>
            {summary.travelMin > 0 && <><span className="dot" /><span>이동 {summary.travelText}</span></>}
            {summary.reserved > 0 && <><span className="dot" /><span>예약 {summary.reserved}</span></>}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', overflowX: 'auto', padding: '0 20px 12px', scrollbarWidth: 'none' }}>
            {blocks?.map((b, i) => (
              <span key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {i > 0 && <Icon d={P.chev} size={12} color="#bdbdc2" stroke={2.5} />}
                <button onClick={() => tap(b.id)} style={{ border: 'none', background: b.id === focus ? 'var(--ink)' : 'var(--chip)', color: b.id === focus ? '#fff' : 'var(--text)', borderRadius: 999, padding: '7px 12px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{b.name}</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto', padding: '0 20px 14px', scrollbarWidth: 'none' }}>
            {(day.snacks ?? []).map((s) => (
              <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <button onClick={() => toggleSnack(s.id)} aria-pressed={!!s.done}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 40, padding: '0 12px', borderRadius: 999, border: s.done ? 'none' : '1.5px dashed #cfcfd3', background: s.done ? 'var(--sky-tint)' : '#fff', color: s.done ? 'var(--sky-text)' : 'var(--text)', fontSize: 14, fontWeight: 600 }}>
                  <Icon d={s.delivery ? P.bag : P.snack} size={16} color={s.done ? 'var(--sky-deep)' : '#9a9aa0'} />
                  {s.brand && <span className="zh" style={{ fontSize: 11, fontWeight: 700, padding: '3px 7px', borderRadius: 7, background: s.done ? '#fff' : 'var(--chip)', color: 'var(--muted)' }}>{s.brand}</span>}
                  <span style={{ textDecoration: s.done ? 'line-through' : 'none' }}>{s.ko}</span>
                </button>
                <button aria-label={`${s.ko} 스티커 떼기`} onClick={() => { setSnacks(snacks.filter((x) => x.id !== s.id)); toast({ text: `${s.ko} 스티커를 뗐어요`, ms: 2500 }); }}
                  style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: '#bdbdc2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d="M6 6l12 12M18 6L6 18" size={14} stroke={2.2} />
                </button>
              </span>
            ))}
            {addSnack ? (
              <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <label className="sr" htmlFor="snack-brand">가게·브랜드</label>
                <input id="snack-brand" value={snackBrand} onChange={(e) => setSnackBrand(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveSnack(); }}
                  placeholder="가게 (예: 蜜雪冰城)" style={{ minHeight: 40, width: 150, borderRadius: 999, border: '1px solid var(--line)', padding: '0 14px', fontSize: 14 }} />
                <label className="sr" htmlFor="snack">먹고 싶은 것</label>
                <input id="snack" autoFocus value={snackText} onChange={(e) => setSnackText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveSnack(); if (e.key === 'Escape') { setAddSnack(false); setSnackText(''); setSnackBrand(''); } }}
                  placeholder="예: 밀크티 / 훠궈 배달" style={{ minHeight: 40, width: 180, borderRadius: 999, border: '1px solid var(--line)', padding: '0 14px', fontSize: 14 }} />
                <button className="btn small" onClick={saveSnack}>붙이기</button>
              </span>
            ) : (
              <button onClick={() => setAddSnack(true)} style={{ flexShrink: 0, minHeight: 40, padding: '0 14px', borderRadius: 999, border: '1.5px dashed #cfcfd3', background: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>
                <Icon d={P.plus} size={16} stroke={2} />군것질 붙이기
              </button>
            )}
          </div>
        </div>
      )}

      {edit && blocks ? (
        <EditList key={editKey} blocks={blocks} onRemove={onRemove} onReorder={onReorder} onDone={() => setEdit(false)} />
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

      {!edit && blocks && blocks.length > 1 && (
        <div style={{ position: 'fixed', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ fontSize: 12, color: '#fff', background: 'var(--ink)', padding: '9px 14px', borderRadius: 999 }}>길게 눌러 끌면 순서를 바꿀 수 있어요</span>
        </div>
      )}

      {sheetBlock && <BlockSheet key={sheetBlock.id} block={sheetBlock} day={day} onClose={() => setSheetId(null)} />}
      {pendingRemove && (
        <Confirm title="정말 뺄까요?" body={`D${day.n} 일정에서 빠지고 가족 모두에게 알림이 가요.`}
          preview={{ label: `알림 미리보기 · D${day.n} 일정 변경`, lines: [`${pendingRemove.name} 빠짐`] }}
          okLabel="빼기" onCancel={cancelRemove} onOk={confirmRemove} />
      )}
    </main>
  );
}

export default function Page() {
  return <Suspense><DayView /></Suspense>;
}
