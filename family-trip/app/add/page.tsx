'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { addExpense, insertBlock, logChange, reorderBlocks, updateBlock, useBlock, useDays } from '@/lib/data';
import { sb } from '@/lib/supabase';
import { MEMBERS } from '@/lib/members';
import { Icon, P, TYPE_LABEL, TYPE_PATHS } from '@/lib/icons';
import { parseDuration, toMin } from '@/lib/time';
import type { Block, BlockType } from '@/lib/types';
import { TopBar, useToast } from '@/components/ui';

const TYPES: BlockType[] = ['tour', 'food', 'shop', 'move', 'stay'];
const CATS = ['식비', '교통', '입장료', '쇼핑', '숙박', '기타'];

function Form() {
  const q = useSearchParams();
  const editId = q.get('edit') ?? undefined;
  const router = useRouter();
  const toast = useToast();
  const { data: days } = useDays();
  const { data: editing } = useBlock(editId);
  const [f, setF] = useState({ name: '', zh: '', addr: '', type: 'tour' as BlockType, dayN: Number(q.get('day') ?? 1), start: '', dur: '', note: '', memo: '', travel: '', todo: '', hasRes: false, owner: '', url: '', cost: '', cat: '입장료', important: false });
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));

  useEffect(() => {
    if (!editing || !days) return;
    const d = days.find((x) => x.id === editing.day_id);
    setF((x) => ({ ...x, name: editing.name, zh: editing.zh_name ?? '', addr: editing.zh_address ?? '', type: editing.type, dayN: d?.n ?? x.dayN, start: editing.start_time ?? '', dur: editing.duration_text ?? '', note: editing.note ?? '', memo: editing.memo ?? '', travel: editing.travel?.text ?? '', hasRes: !!editing.reservation, owner: editing.reservation?.owner ?? '', url: editing.reservation?.url ?? '', important: editing.important }));
  }, [editing, days]);

  const save = async () => {
    const day = days?.find((d) => d.n === f.dayN);
    if (!day || !f.name.trim()) return;
    setBusy(true);
    try {
      const patch: Partial<Block> = {
        day_id: day.id, name: f.name.trim(), zh_name: f.zh.trim() || null, zh_address: f.addr.trim() || null, type: f.type,
        start_time: f.start || null, duration_text: f.dur.trim() || null, duration_min: parseDuration(f.dur),
        note: f.note.trim() || null, memo: f.memo.trim() || null, important: f.important,
        travel: f.travel.trim() ? { fromId: 'manual', mode: /도보|걸/.test(f.travel) ? 'walk' : /택시|디디/.test(f.travel) ? 'taxi' : 'transit', minutes: parseDuration(f.travel) ?? 0, text: f.travel.trim() } : null,
        reservation: f.hasRes ? { ...(editing?.reservation ?? {}), owner: f.owner || undefined, url: f.url || undefined } : null,
      };
      let saved: Block;
      if (editing) {
        await updateBlock(editing.id, patch);
        saved = { ...editing, ...patch } as Block;
        await logChange(day.n, `${saved.name} 수정${f.start ? ' · ' + f.start : ''}`);
      } else {
        saved = await insertBlock({ ...patch, position: 999, todos: f.todo.trim() ? [{ id: 'a', text: f.todo.trim(), done: false }] : [] });
        await logChange(day.n, `${saved.name} 추가${f.start ? ' · ' + f.start : ''}`);
        if (f.cost) await addExpense({ day_id: day.id, block_id: saved.id, label: saved.name, category: f.cat, amount: Number(f.cost) });
      }
      // 시작 시간 순으로 자리 정리
      const { data } = await sb().from('blocks').select('id,start_time,position').eq('day_id', day.id);
      const sorted = (data ?? []).sort((a, b) => (toMin(a.start_time) ?? 9999) - (toMin(b.start_time) ?? 9999) || a.position - b.position);
      await reorderBlocks(sorted.map((x) => x.id));
      router.push(`/day/${day.n}`);
    } catch (e) {
      toast({ text: e instanceof Error ? e.message : '저장하지 못했어요' });
      setBusy(false);
    }
  };

  const mins = parseDuration(f.dur);
  return (
    <main className="page" style={{ paddingBottom: 60 }}>
      <TopBar back={() => router.back()} center={<b style={{ fontSize: 17 }}>{editId ? '일정 수정' : '일정 추가'}</b>}
        right={<button className="btn small" disabled={!f.name.trim() || busy} onClick={save}>{busy ? '저장 중' : '저장'}</button>} />
      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          <div className="field"><label htmlFor="name">이름</label><input id="name" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="예: 티엔즈팡" /></div>
          <div className="field"><label htmlFor="zh">중국어 이름 (위치 찾기에 써요)</label><input id="zh" className="zh" lang="zh-CN" value={f.zh} onChange={(e) => set({ zh: e.target.value })} placeholder="예: 田子坊" /></div>
          <div className="field"><label>종류</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {TYPES.map((t) => (
                <button key={t} aria-pressed={f.type === t} onClick={() => set({ type: t })}
                  style={{ minHeight: 64, borderRadius: 18, border: f.type === t ? '1.5px solid var(--ink)' : '1.5px solid var(--chip)', background: f.type === t ? '#fff' : 'var(--chip)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  <Icon d={TYPE_PATHS[t]} size={22} />{TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: 8 }}>
            <div className="field"><label htmlFor="day">날짜</label><select id="day" value={f.dayN} onChange={(e) => set({ dayN: Number(e.target.value) })}>{days?.map((d) => <option key={d.id} value={d.n}>D{d.n}</option>)}</select></div>
            <div className="field"><label htmlFor="start">시작</label><input id="start" type="time" value={f.start} onChange={(e) => set({ start: e.target.value })} /></div>
            <div className="field"><label htmlFor="dur">머무는 시간</label><input id="dur" value={f.dur} onChange={(e) => set({ dur: e.target.value })} placeholder="예: 1시간 30분" /></div>
          </div>
          {f.dur && <span style={{ fontSize: 12, color: mins ? 'var(--muted)' : 'var(--sky-text)', marginTop: -8 }}>{mins ? `${mins}분으로 계산해요` : '시간으로 읽지 못했어요 · "40분", "2시간"처럼 적어주세요'}</span>}
          <div className="field"><label htmlFor="addr">중국어 주소 (기사님께 보여줄 것)</label><input id="addr" className="zh" lang="zh-CN" value={f.addr} onChange={(e) => set({ addr: e.target.value })} placeholder="上海市黄浦区 ..." /></div>
          <div className="field"><label htmlFor="note">장소 특이사항</label><input id="note" value={f.note} onChange={(e) => set({ note: e.target.value })} placeholder="예: 오전이 덜 붐빔, 월요일 휴무" /></div>
          <div className="field"><label htmlFor="memo">메모</label><input id="memo" value={f.memo} onChange={(e) => set({ memo: e.target.value })} placeholder="예: 구곡교에서 가족사진" /></div>
          <div className="field"><label htmlFor="travel">이전 장소에서 오는 이동</label><input id="travel" value={f.travel} onChange={(e) => set({ travel: e.target.value })} placeholder="예: 지하철 25분, 도보 8분" /><span style={{ fontSize: 12, color: 'var(--muted)' }}>적어두면 하루 목록의 블록 사이에 보여요</span></div>
          {!editId && <div className="field"><label htmlFor="todo">할 일</label><input id="todo" value={f.todo} onChange={(e) => set({ todo: e.target.value })} placeholder="예: 여권 챙기기" /></div>}
        </div>

        <div className="card">
          <button onClick={() => set({ hasRes: !f.hasRes })} aria-pressed={f.hasRes} style={{ minHeight: 44, border: 'none', background: 'transparent', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <b style={{ fontSize: 15 }}>예약이 있어요</b>
            <span style={{ width: 50, height: 30, borderRadius: 15, background: f.hasRes ? 'var(--ink)' : '#dadadd', display: 'flex', justifyContent: f.hasRes ? 'flex-end' : 'flex-start', padding: 3 }}><span style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff' }} /></span>
          </button>
          {f.hasRes && <>
            <div className="field"><label>예약 담당</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{MEMBERS.map((m) => (
                <button key={m.name} className="btn small" aria-pressed={f.owner === m.name} onClick={() => set({ owner: m.name })}
                  style={{ background: f.owner === m.name ? 'var(--ink)' : 'var(--chip)', color: f.owner === m.name ? '#fff' : 'var(--text)' }}>{m.name}</button>
              ))}</div>
            </div>
            <div className="field"><label htmlFor="url">예약 페이지 링크</label><input id="url" type="url" inputMode="url" value={f.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://" /></div>
          </>}
        </div>

        <div className="card">
          {!editId && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="field"><label htmlFor="cost">지출 (¥)</label><input id="cost" inputMode="decimal" value={f.cost} onChange={(e) => set({ cost: e.target.value.replace(/[^\d.]/g, '') })} placeholder="0" /></div>
              <div className="field"><label htmlFor="cat">항목</label><select id="cat" value={f.cat} onChange={(e) => set({ cat: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
            </div>
          )}
          <button className="btn soft" aria-pressed={f.important} onClick={() => set({ important: !f.important })} style={{ background: f.important ? 'var(--sky-tint)' : 'var(--chip)' }}>
            <Icon d={P.star} size={18} color="var(--sky-deep)" fill={f.important ? 'var(--sky-deep)' : 'none'} />중요 표시 (날짜 화면에 보여요)
          </button>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return <Suspense><Form /></Suspense>;
}
