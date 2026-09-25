'use client';
import { useMemo, useState } from 'react';
import { addWish, deleteWish, updateWish, uploadCapture, useDays, useWishes, Wish } from '@/lib/data';
import { Icon, P } from '@/lib/icons';
import { TopBar, useToast } from '@/components/ui';

const TABS = [
  { id: 'store', label: '편의점 털 것', icon: P.bag, hint: '예: 农夫山泉 · 물', who: false },
  { id: 'gift', label: '기념품 사갈 것', icon: P.star, hint: '예: 大白兔 · 밀크캔디', who: true },
  { id: 'delivery', label: '배달 시킬 것', icon: P.bag, hint: '예: 海底捞 · 훠궈', who: false },
  { id: 'snack', label: '길거리 간식', icon: P.snack, hint: '', who: false },
] as const;
type Tab = (typeof TABS)[number]['id'];

export default function WishPage() {
  const [tab, setTab] = useState<Tab>('store');
  const [ko, setKo] = useState('');
  const [brand, setBrand] = useState('');
  const [forwho, setForwho] = useState('');
  const [memo, setMemo] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [big, setBig] = useState<string | null>(null);
  const { data: wishes, refresh } = useWishes();
  const { data: days } = useDays();
  const toast = useToast();
  const cur = TABS.find((t) => t.id === tab)!;

  const list = useMemo(() => (wishes ?? []).filter((w) => w.cat === tab), [wishes, tab]);
  const snacks = useMemo(() => (days ?? []).flatMap((d) => (d.snacks ?? []).map((s) => ({ ...s, dayN: d.n }))), [days]);
  const count = (id: Tab) => id === 'snack' ? snacks.length : (wishes ?? []).filter((w) => w.cat === id).length;

  const add = async () => {
    const name = ko.trim();
    if (!name || tab === 'snack') return;
    try {
      await addWish({ cat: tab, ko: name, brand: brand.trim() || null, forwho: forwho.trim() || null, memo: memo.trim() || null, photo });
      setKo(''); setBrand(''); setForwho(''); setMemo(''); setPhoto(null);
      refresh();
      toast({ text: `${name} 담았어요`, ms: 2500 });
    } catch (e) { toast({ text: e instanceof Error ? e.message : '담지 못했어요' }); }
  };
  const upload = async (f: File | undefined, onDone: (url: string) => void) => {
    if (!f) return;
    setBusy(true);
    try { onDone(await uploadCapture(f)); }
    catch (e) { toast({ text: e instanceof Error ? e.message : '사진을 올리지 못했어요' }); }
    setBusy(false);
  };
  const toggle = (w: Wish) => updateWish(w.id, { done: !w.done }).then(refresh).catch((e) => toast({ text: e.message }));
  const remove = (w: Wish) => deleteWish(w.id).then(() => { refresh(); toast({ text: `${w.ko} 뺐어요`, ms: 2500 }); }).catch((e) => toast({ text: e.message }));

  return (
    <main className="page">
      <TopBar back="/trip" />
      <div className="head">
        <h1 className="big">사갈 것·먹을 것</h1>
        <div className="meta"><span>가족 모두 같이 채워요</span><span className="dot" /><span>산 건 눌러서 도장</span></div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '20px 24px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map((t) => (
          <button key={t.id} className="btn small" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}
            style={{ flexShrink: 0, background: tab === t.id ? 'var(--ink)' : 'var(--chip)', color: tab === t.id ? '#fff' : 'var(--text)' }}>
            {t.label} {count(t.id) || ''}
          </button>
        ))}
      </div>

      {tab !== 'snack' && (
        <div className="card" style={{ margin: '16px 20px 0', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="field" style={{ flex: 1 }}><label htmlFor="w-brand">가게·브랜드</label><input id="w-brand" className="zh" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={cur.hint.split(' · ')[0]} /></div>
            <div className="field" style={{ flex: 1.3 }}><label htmlFor="w-ko">이름</label><input id="w-ko" value={ko} onChange={(e) => setKo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={cur.hint.split(' · ')[1]} /></div>
          </div>
          {cur.who && <div className="field"><label htmlFor="w-who">누구 거</label><input id="w-who" value={forwho} onChange={(e) => setForwho(e.target.value)} placeholder="예: 회사 동료들" /></div>}
          <div className="field"><label htmlFor="w-memo">메모</label><input id="w-memo" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 2+1 행사할 때 사기, 초록색 포장" /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {photo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={photo} alt="담을 사진" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover' }} />
              : <span style={{ width: 56, height: 56, borderRadius: 14, background: '#fff', border: '1.5px dashed #cfcfd3' }} />}
            <label className="btn soft small" style={{ cursor: 'pointer' }}>
              {busy ? '올리는 중…' : photo ? '사진 바꾸기' : '사진 넣기'}
              <input type="file" accept="image/*" className="sr" onChange={(e) => upload(e.target.files?.[0], setPhoto)} />
            </label>
            {photo && <button className="btn small soft" onClick={() => setPhoto(null)}>빼기</button>}
          </div>
          <button className="btn" disabled={!ko.trim()} onClick={add}><Icon d={P.plus} size={18} stroke={2} />담기</button>
        </div>
      )}

      <div className="rows" style={{ marginTop: 12 }}>
        {tab === 'snack' ? (
          snacks.length === 0
            ? <p className="empty">하루 화면의 "군것질 붙이기"로 붙인 게 여기 다 모여요</p>
            : snacks.map((s) => (
              <div className="row" key={s.id}>
                <span className="circle" style={{ background: s.done ? 'var(--sky-tint)' : 'var(--chip)', color: s.done ? 'var(--sky-deep)' : 'var(--ink)' }}><Icon d={s.delivery ? P.bag : P.snack} size={18} /></span>
                <span className="txt"><b style={{ textDecoration: s.done ? 'line-through' : 'none' }}>{s.brand ? <span className="zh" style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginRight: 6 }}>{s.brand}</span> : null}{s.ko}</b><span>D{s.dayN}{s.done ? ' · 먹었어요' : ''}</span></span>
              </div>
            ))
        ) : list.length === 0 ? (
          <p className="empty">아직 없어요. 위에서 담아보세요</p>
        ) : list.map((w) => (
          <div className="row" key={w.id}>
            <button onClick={() => toggle(w)} aria-pressed={w.done} aria-label={`${w.ko} ${w.done ? '안 산 걸로' : '산 걸로'}`}
              className="circle" style={{ border: 'none', background: w.done ? 'var(--sky-tint)' : 'var(--chip)', color: w.done ? 'var(--sky-deep)' : '#9a9aa0' }}>
              <Icon d={w.done ? P.check : cur.icon} size={18} stroke={w.done ? 2.6 : 1.8} />
            </button>
            <span className="txt">
              <b style={{ textDecoration: w.done ? 'line-through' : 'none', color: w.done ? 'var(--muted)' : 'var(--ink)' }}>
                {w.brand && <span className="zh" style={{ fontSize: 12, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: 'var(--chip)', color: 'var(--muted)', marginRight: 6 }}>{w.brand}</span>}
                {w.ko}
              </b>
              {w.memo && <span style={{ color: 'var(--text)' }}>{w.memo}</span>}
              <span>{[w.forwho && `${w.forwho} 줄 거`, w.by && `${w.by}가 담음`].filter(Boolean).join(' · ')}</span>
            </span>
            {w.photo ? (
              <button onClick={() => setBig(w.photo)} aria-label={`${w.ko} 사진 크게 보기`} style={{ border: 'none', padding: 0, background: 'none', flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.photo} alt={w.ko} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
              </button>
            ) : (
              <label className="icon-btn" aria-label={`${w.ko} 사진 넣기`} style={{ cursor: 'pointer', color: '#bdbdc2' }}>
                <Icon d="M4 8h3l2-3h6l2 3h3v11H4zM8.5 13a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0" size={18} />
                <input type="file" accept="image/*" className="sr" onChange={(e) => upload(e.target.files?.[0], (url) => updateWish(w.id, { photo: url }).then(refresh))} />
              </label>
            )}
            <button className="icon-btn" aria-label={`${w.ko} 빼기`} onClick={() => remove(w)} style={{ color: '#bdbdc2' }}><Icon d="M6 6l12 12M18 6L6 18" size={16} stroke={2.2} /></button>
          </div>
        ))}
      </div>
      {big && (
        <button onClick={() => setBig(null)} aria-label="닫기" style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.85)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={big} alt="크게 보기" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 16 }} />
        </button>
      )}
    </main>
  );
}
