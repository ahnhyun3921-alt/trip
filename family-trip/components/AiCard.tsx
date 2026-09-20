'use client';
import { useState } from 'react';
import { Icon, P } from '@/lib/icons';
import type { AiOption } from '@/lib/types';
import { Confirm } from './ui';

export default function AiCard({ heading, sub, loading, error, options, dayN, onApply, onClose }: {
  heading: string; sub: string; loading: boolean; error: string | null; options: AiOption[]; dayN: number;
  onApply: (o: AiOption) => void; onClose: () => void;
}) {
  const [pick, setPick] = useState(0);
  const [ask, setAsk] = useState(false);
  const chosen = options[pick];
  return (
    <>
      <section aria-label="AI 제안" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 12, width: 'calc(100% - 24px)', maxWidth: 456, background: '#fff', borderRadius: 30, padding: '18px 16px 16px', boxShadow: '0 16px 40px rgba(0,0,0,0.16)', display: 'flex', flexDirection: 'column', gap: 12, zIndex: 25, maxHeight: '70dvh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, padding: '0 4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--sky-text)' }}><Icon d={P.spark} size={16} stroke={2} />AI 제안</span>
            <b style={{ fontSize: 17 }}>{heading}</b>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{sub}</span>
          </div>
          <button className="btn small soft" onClick={onClose}>그대로 둘게요</button>
        </div>
        {loading && <p style={{ margin: 0, padding: '12px 4px', fontSize: 14, color: 'var(--muted)' }}>장소별 특이사항과 예약을 보고 짜는 중…</p>}
        {error && <p style={{ margin: 0, padding: '8px 4px', fontSize: 14 }}>{error}</p>}
        {options.map((o, i) => (
          <button key={i} aria-pressed={i === pick} onClick={() => setPick(i)}
            style={{ border: i === pick ? 'none' : '1.5px solid var(--line)', background: i === pick ? 'var(--sky-tint)' : '#fff', borderRadius: 20, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, width: '100%' }}><b style={{ fontSize: 15 }}>{o.title}</b></span>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{o.summary}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{o.reason}</span>
          </button>
        ))}
        {chosen && <button className="btn" onClick={() => setAsk(true)}>이 안으로 바꾸기</button>}
      </section>
      {ask && chosen && (
        <Confirm title="정말 이렇게 바꿀까요?" body={`D${dayN} 일정이 바뀌고 가족 모두에게 알림이 가요.`}
          preview={{ label: `알림 미리보기 · D${dayN} 일정 변경`, lines: [chosen.summary] }}
          okLabel="바꾸기" onCancel={() => setAsk(false)} onOk={() => { setAsk(false); onApply(chosen); }} />
      )}
    </>
  );
}
