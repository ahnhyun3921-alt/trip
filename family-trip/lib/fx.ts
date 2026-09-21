'use client';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'fx.cny.krw';
export type Fx = { rate: number; date: string; manual?: boolean };

export function useFx() {
  const [fx, setFx] = useState<Fx | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(KEY);
      if (cached) setFx(JSON.parse(cached) as Fx);
    } catch { /* 무시 */ }
    fetch('/api/fx')
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error);
        const next = { rate: Number(j.rate), date: String(j.date) };
        setFx(next);
        localStorage.setItem(KEY, JSON.stringify(next));
      })
      .catch((e) => setError(e instanceof Error ? e.message : '환율을 못 받았어요'));
  }, []);

  // 직접 적어 넣기 (인터넷이 막혔을 때)
  const setManual = useCallback((rate: number) => {
    const next = { rate, date: new Date().toISOString().slice(0, 10), manual: true };
    setFx(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setError(null);
  }, []);

  return { fx, error, setManual };
}

export function toKrw(cny: number, rate: number) {
  return Math.round(cny * rate);
}
