'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { addExpense, updateBlock, uploadCapture, useExpenses } from '@/lib/data';
import { MEMBERS } from '@/lib/members';
import { Icon, P, TYPE_PATHS } from '@/lib/icons';
import { rangeText } from '@/lib/time';
import type { Block, Day } from '@/lib/types';
import { Sheet, useToast } from './ui';

const CATS = ['식비', '교통', '입장료', '쇼핑', '숙박', '기타'];

export default function BlockSheet({ block, day, onClose }: { block: Block | null; day: Day; onClose: () => void }) {
  const [tab, setTab] = useState<'todo' | 'res'>('todo');
  const [newTodo, setNewTodo] = useState('');
  const [spendOpen, setSpendOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('입장료');
  const toast = useToast();
  const { data: expenses } = useExpenses();
  const spent = useMemo(() => (expenses ?? []).filter((e) => e.block_id === block?.id).reduce((s, e) => s + Number(e.amount), 0), [expenses, block]);

  if (!block) return null;
  const b = block;
  const left = b.todos.filter((t) => !t.done).length;
  const res = b.reservation;

  const save = (patch: Partial<Block>) => updateBlock(b.id, patch).catch((e) => toast({ text: e.message }));
  const toggle = (id: string) => save({ todos: b.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
  const add = () => {
    const text = newTodo.trim();
    if (!text) return;
    save({ todos: [...b.todos, { id: Math.random().toString(36).slice(2, 8), text, done: false }] });
    setNewTodo('');
  };
  const setRes = (patch: Partial<NonNullable<Block['reservation']>>) => save({ reservation: { ...(res ?? {}), ...patch } });

  return (
    <Sheet open={!!block} onClose={onClose} label={`${b.name} 상세`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sky-deep)', flexShrink: 0 }}><Icon d={TYPE_PATHS[b.type]} size={24} /></span>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h2 style={{ margin: 0, fontSize: 21 }}>{b.name}</h2>
          <div className="meta" style={{ fontSize: 13 }}><span>{rangeText(b.start_time, b.duration_min) || '시간 미정'}</span>{b.zh_name && <><span className="dot" /><span className="zh">{b.zh_name}</span></>}</div>
        </div>
        <button className="icon-btn" aria-pressed={b.important} aria-label="중요 표시" onClick={() => save({ important: !b.important })}>
          <Icon d={P.star} size={22} color={b.important ? 'var(--sky-deep)' : '#bdbdc2'} fill={b.important ? 'var(--sky-deep)' : 'none'} />
        </button>
        <Link href={`/add?edit=${b.id}`} className="btn small soft">수정</Link>
      </div>
      {b.memo && <p style={{ margin: 0, fontSize: 14, color: 'var(--text)' }}>{b.memo}</p>}

      <div className="tabs">
        <button aria-pressed={tab === 'todo'} onClick={() => setTab('todo')}>할 일 {left || ''}</button>
        <button aria-pressed={tab === 'res'} onClick={() => setTab('res')}>예약</button>
      </div>

      {tab === 'todo' ? (
        <div>
          {b.todos.map((t) => (
            <button key={t.id} onClick={() => toggle(t.id)} style={{ width: '100%', minHeight: 56, border: 'none', borderBottom: '1px solid #f0f0f2', background: 'transparent', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '0 2px' }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.done ? 'var(--ink)' : 'transparent', border: t.done ? 'none' : '1.5px solid #bdbdc2', color: '#fff' }}>{t.done && <Icon d={P.check} size={14} stroke={3} />}</span>
              <span style={{ fontSize: 15, textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--muted)' : 'var(--ink)' }}>{t.text}</span>
            </button>
          ))}
          <label className="sr" htmlFor="new-todo">할 일 추가</label>
          <input id="new-todo" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="할 일 적고 Enter"
            style={{ marginTop: 14, width: '100%', minHeight: 46, border: 'none', borderRadius: 14, padding: '0 16px', background: 'var(--surface)', fontSize: 16 }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <label>예약 담당</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {MEMBERS.map((m) => (
                <button key={m.name} className="btn small" onClick={() => setRes({ owner: m.name })}
                  style={{ background: res?.owner === m.name ? 'var(--ink)' : 'var(--chip)', color: res?.owner === m.name ? '#fff' : 'var(--text)' }}>{m.name}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="res-num">예약번호</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input id="res-num" defaultValue={res?.number ?? ''} onBlur={(e) => e.target.value !== (res?.number ?? '') && setRes({ number: e.target.value, status: '예약 완료' })} />
              <button className="btn small soft" onClick={() => res?.number && navigator.clipboard.writeText(res.number).then(() => toast({ text: '예약번호를 복사했어요', ms: 2000 }))}>복사</button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="res-url">예약 페이지 링크</label>
            <input id="res-url" type="url" inputMode="url" defaultValue={res?.url ?? ''} placeholder="https://" onBlur={(e) => e.target.value !== (res?.url ?? '') && setRes({ url: e.target.value })} />
          </div>
          {res?.capture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <a href={res.capture} target="_blank" rel="noreferrer"><img src={res.capture} alt="예약 확인 캡처" style={{ width: '100%', borderRadius: 18, border: '1px solid var(--line)' }} /></a>
          ) : (
            <label style={{ height: 88, border: '1.5px dashed #cfcfd3', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>
              예약 확인 화면 캡처 올리기
              <input type="file" accept="image/*" className="sr" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                try { setRes({ capture: await uploadCapture(f) }); } catch (err) { toast({ text: err instanceof Error ? err.message : '올리지 못했어요' }); }
              }} />
            </label>
          )}
          {res?.url && <a className="btn outline" href={res.url} target="_blank" rel="noreferrer" style={{ borderRadius: 999 }}>예약 페이지 열기<Icon d={P.out} size={16} stroke={2} /></a>}
        </div>
      )}

      <div style={{ borderTop: '1px solid #f0f0f2', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 12, color: 'var(--muted)' }}>지출</span><b style={{ fontSize: 16 }}>¥ {spent.toLocaleString()}</b></div>
          <button className="btn small outline" onClick={() => setSpendOpen((v) => !v)}>기록</button>
        </div>
        {spendOpen && (
          <div style={{ display: 'flex', gap: 8 }}>
            <label className="sr" htmlFor="amt">금액</label>
            <input id="amt" inputMode="decimal" placeholder="¥ 금액" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} style={{ flex: 1, minHeight: 44, borderRadius: 12, border: '1px solid #eaeaec', padding: '0 12px', background: '#f7f7f8' }} />
            <label className="sr" htmlFor="cat">항목</label>
            <select id="cat" value={cat} onChange={(e) => setCat(e.target.value)} style={{ minHeight: 44, borderRadius: 12, border: '1px solid #eaeaec', padding: '0 8px', background: '#f7f7f8' }}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
            <button className="btn small" disabled={!amount} onClick={async () => {
              try { await addExpense({ day_id: day.id, block_id: b.id, label: b.name, category: cat, amount: Number(amount) }); setAmount(''); setSpendOpen(false); toast({ text: '지출을 적었어요', ms: 2000 }); }
              catch (e) { toast({ text: e instanceof Error ? e.message : '적지 못했어요' }); }
            }}>저장</button>
          </div>
        )}
      </div>

      <Link href={`/move/${b.id}`} style={{ minHeight: 72, padding: 12, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--ink)', borderRadius: 22, color: '#fff' }}>
        <span style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--sky)', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon d={b.travel?.mode === 'walk' ? P.walk : P.subway} size={22} /></span>
        <span style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><b style={{ fontSize: 16 }}>이동하기</b><span style={{ fontSize: 13, color: '#a1a1a6' }}>{b.travel?.text ?? '경로 보기'}</span></span>
        <span style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon d={P.arrow} size={18} stroke={2} /></span>
      </Link>
    </Sheet>
  );
}
