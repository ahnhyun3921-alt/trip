'use client';
import Link from 'next/link';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Icon, P } from '@/lib/icons';

export function TopBar({ back, right, center }: { back?: string | (() => void); right?: ReactNode; center?: ReactNode }) {
  return (
    <div className="top">
      {typeof back === 'string' ? (
        <Link href={back} className="icon-btn" aria-label="뒤로"><Icon d={P.back} size={22} stroke={2} /></Link>
      ) : back ? (
        <button className="icon-btn" aria-label="뒤로" onClick={back}><Icon d={P.back} size={22} stroke={2} /></button>
      ) : <span style={{ width: 44 }} />}
      {center ?? <span />}
      <div className="right">{right}</div>
    </div>
  );
}

export function BlackBar({ href, onClick, icon, title, sub, trail = P.arrow, progress }: { href?: string; onClick?: () => void; icon: string; title: string; sub?: string; trail?: string; progress?: number }) {
  const inner = (
    <>
      <span className="sq"><Icon d={icon} size={24} /></span>
      <span className="txt">
        <b>{title}</b>
        {sub && <span>{sub}</span>}
        {progress != null && <span className="bar"><i style={{ width: `${Math.round(progress * 100)}%` }} /></span>}
      </span>
      <span className="go"><Icon d={trail} size={18} stroke={2} /></span>
    </>
  );
  return href ? <Link href={href} className="blackbar">{inner}</Link> : <button className="blackbar" onClick={onClick}>{inner}</button>;
}

export function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <section className="sheet" role="dialog" aria-label={label}>
        <span className="handle" />
        {children}
      </section>
    </>
  );
}

export function Confirm({ title, body, preview, okLabel, onOk, onCancel }: { title: string; body: string; preview?: { label: string; lines: string[] }; okLabel: string; onOk: () => void; onCancel: () => void }) {
  return (
    <div className="dialog-wrap">
      <div className="dialog" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <p>{body}</p>
        {preview && (
          <div className="preview">
            <small>{preview.label}</small>
            {preview.lines.map((l, i) => <b key={i}>{l}</b>)}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn soft" style={{ flex: 1 }} onClick={onCancel}>취소</button>
          <button className="btn" style={{ flex: 1 }} onClick={onOk}>{okLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ---------- 최상단 토스트 ----------
type ToastT = { text: string; action?: { label: string; run: () => void }; ms?: number };
const ToastCtx = createContext<(t: ToastT) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<ToastT | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const show = useCallback((x: ToastT) => {
    setT(x);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setT(null), x.ms ?? 5000);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {t && (
        <div className="toast" role="status">
          <span>{t.text}</span>
          {t.action && <button onClick={() => { t.action!.run(); setT(null); }}>{t.action.label}</button>}
        </div>
      )}
    </ToastCtx.Provider>
  );
}
