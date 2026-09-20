'use client';
import { useMemo, useState } from 'react';
import { addExpense, useDays, useExpenses } from '@/lib/data';
import { Icon, P } from '@/lib/icons';
import { BlackBar, Sheet, TopBar, useToast } from '@/components/ui';

const CATS = ['식비', '교통', '입장료', '쇼핑', '숙박', '기타'];
const CAT_ICON: Record<string, string> = { 식비: 'M4 11h16a8 8 0 0 1-16 0zM9 7c0-1.5 1-1.5 1-3M13 7c0-1.5 1-1.5 1-3', 교통: P.subway, 입장료: P.ticket, 쇼핑: 'M6 8h12l-1 12H7L6 8zM9 8a3 3 0 0 1 6 0', 숙박: P.hotel, 기타: P.receipt };

export default function Spend() {
  const { data: exps } = useExpenses();
  const { data: days } = useDays();
  const [mode, setMode] = useState<'day' | 'cat'>('day');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: '', amount: '', cat: '식비', dayN: 1 });
  const toast = useToast();

  const total = useMemo(() => (exps ?? []).reduce((s, e) => s + Number(e.amount), 0), [exps]);
  const rows = useMemo(() => {
    const list = exps ?? [];
    const src = mode === 'day'
      ? (days ?? []).map((d) => [`D${d.n}`, list.filter((e) => e.day_id === d.id).reduce((s, e) => s + Number(e.amount), 0)] as const)
      : CATS.map((c) => [c, list.filter((e) => e.category === c).reduce((s, e) => s + Number(e.amount), 0)] as const);
    const max = Math.max(1, ...src.map((x) => x[1]));
    return src.map(([label, v]) => ({ label, v, pct: Math.round((v / max) * 100) }));
  }, [exps, days, mode]);

  const save = async () => {
    const d = days?.find((x) => x.n === form.dayN);
    try {
      await addExpense({ day_id: d?.id ?? null, label: form.label.trim() || form.cat, category: form.cat, amount: Number(form.amount) });
      setOpen(false); setForm((f) => ({ ...f, label: '', amount: '' }));
      toast({ text: '지출을 적었어요', ms: 2000 });
    } catch (e) { toast({ text: e instanceof Error ? e.message : '적지 못했어요' }); }
  };

  return (
    <main className="page">
      <TopBar back="/trip" center={<b style={{ fontSize: 15 }}>지출</b>} />
      <div className="head">
        <span style={{ fontSize: 14, color: 'var(--muted)' }}>지금까지 쓴 돈</span>
        <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em' }}>¥ {total.toLocaleString()}</span>
      </div>
      <div className="tabs" style={{ padding: '20px 24px 0', justifyContent: 'flex-start' }}>
        <button aria-pressed={mode === 'day'} style={{ flexGrow: 0, padding: '0 18px', minHeight: 40 }} onClick={() => setMode('day')}>날짜별</button>
        <button aria-pressed={mode === 'cat'} style={{ flexGrow: 0, padding: '0 18px', minHeight: 40 }} onClick={() => setMode('cat')}>항목별</button>
      </div>
      <div style={{ padding: '18px 24px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 30 }}>
            <span style={{ width: 52, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{r.label}</span>
            <span style={{ flexGrow: 1, height: 26, borderRadius: 8, background: 'var(--chip)', overflow: 'hidden' }}><span style={{ display: 'block', height: 26, width: `${r.pct}%`, background: 'var(--ink)', borderRadius: 8, transition: 'width 0.4s' }} /></span>
            <span style={{ width: 70, textAlign: 'right', fontSize: 14, fontWeight: 700 }}>{r.v ? `¥ ${r.v.toLocaleString()}` : '—'}</span>
          </div>
        ))}
      </div>
      <div className="sec-h"><span><b style={{ color: 'var(--ink)' }}>최근</b>기록</span></div>
      <div className="rows">
        {(exps ?? []).length === 0 && <p className="empty" style={{ padding: '8px 0' }}>아래 버튼이나 블록 시트에서 금액을 적으면 여기 쌓여요</p>}
        {(exps ?? []).slice(0, 30).map((e) => (
          <div className="row" key={e.id}>
            <span className="circle"><Icon d={CAT_ICON[e.category] ?? P.receipt} size={18} /></span>
            <span className="txt"><b>{e.label}</b><span>{e.category}{days?.find((d) => d.id === e.day_id) ? ` · D${days.find((d) => d.id === e.day_id)!.n}` : ''}</span></span>
            <span className="amt">¥ {Number(e.amount).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <BlackBar onClick={() => setOpen(true)} icon={P.receipt} title="지출 적기" sub="금액 · 항목 · 날짜" trail={P.plus} />
      <Sheet open={open} onClose={() => setOpen(false)} label="지출 적기">
        <h2 style={{ margin: 0, fontSize: 21 }}>지출 적기</h2>
        <div className="field"><label htmlFor="e-amt">금액 (¥)</label><input id="e-amt" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, '') })} placeholder="0" /></div>
        <div className="field"><label htmlFor="e-label">어디에</label><input id="e-label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="예: 편의점 물" /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="field"><label htmlFor="e-cat">항목</label><select id="e-cat" value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field"><label htmlFor="e-day">날짜</label><select id="e-day" value={form.dayN} onChange={(e) => setForm({ ...form, dayN: Number(e.target.value) })}>{days?.map((d) => <option key={d.id} value={d.n}>D{d.n}</option>)}</select></div>
        </div>
        <button className="btn" disabled={!form.amount} onClick={save}>저장</button>
      </Sheet>
    </main>
  );
}
