'use client';
import { useState } from 'react';
import { CARD_ICONS, Icon, P } from '@/lib/icons';
import { PHRASES, Phrase } from '@/lib/phrases';
import { TopBar } from '@/components/ui';

export default function Cards() {
  const [open, setOpen] = useState<Phrase | null>(null);
  const [speakErr, setSpeakErr] = useState<string | null>(null);

  const speak = (zh: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { setSpeakErr('이 기기에서는 소리로 읽어줄 수 없어요'); return; }
    const u = new SpeechSynthesisUtterance(zh);
    u.lang = 'zh-CN';
    u.rate = 0.85;
    const zhVoice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('zh'));
    if (zhVoice) u.voice = zhVoice;
    else setSpeakErr('중국어 음성이 없어서 어색하게 들릴 수 있어요. 폰 설정에서 중국어 음성을 받으면 좋아요');
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  return (
    <main className="page">
      <TopBar back="/trip" />
      <div className="head">
        <h1 className="big">중국어 카드</h1>
        <div className="meta"><span>누르면 크게 보여요</span><span className="dot" /><span>발음과 소리도 같이</span></div>
      </div>

      {PHRASES.map((g) => (
        <section key={g.id}>
          <div className="sec-h"><span><b style={{ color: 'var(--ink)' }}>{g.label}</b></span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 24px' }}>
            {g.items.map((p) => (
              <button key={p.id} onClick={() => { setSpeakErr(null); setOpen(p); }}
                style={{ minHeight: 104, border: '1px solid var(--line)', background: '#fff', borderRadius: 22, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8, textAlign: 'left' }}>
                <span style={{ width: 40, height: 40, borderRadius: 14, background: g.id === 'allergy' ? 'var(--sky-tint)' : 'var(--chip)', color: g.id === 'allergy' ? 'var(--sky-text)' : 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={CARD_ICONS[p.icon] ?? CARD_ICONS.help} size={20} />
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>{p.ko}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: '#fff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 12px 0' }}>
            <button className="icon-btn" aria-label="닫기" onClick={() => setOpen(null)}><Icon d={P.back} size={22} stroke={2} /></button>
          </div>
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22, padding: '0 24px 24px' }}>
            <span className="zh" lang="zh-CN" style={{ fontSize: 'min(9vw, 44px)', fontWeight: 800, lineHeight: 1.35 }}>{open.zh}</span>
            <span style={{ height: 1, background: 'var(--line)' }} />
            <span style={{ fontSize: 18, fontWeight: 600 }}>{open.ko}</span>
            <span style={{ fontSize: 16, color: 'var(--sky-text)', fontWeight: 600 }}>{open.yin}</span>
            {open.note && <span style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>{open.note}</span>}
            {speakErr && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{speakErr}</span>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => speak(open.zh)}><Icon d={CARD_ICONS.speaker} size={20} />소리로 듣기</button>
              <button className="btn outline" onClick={() => navigator.clipboard?.writeText(open.zh)}><Icon d={P.copy} size={18} />복사</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
