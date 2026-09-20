'use client';
import { ReactNode, useCallback, useEffect } from 'react';
import { ToastProvider, useToast } from './ui';
import { useChangeFeed } from '@/lib/data';
import type { Change } from '@/lib/types';

function Feed() {
  const toast = useToast();
  const on = useCallback((c: Change) => toast({ text: `${c.day_n ? `D${c.day_n} 일정 변경 · ` : ''}${c.summary}`, ms: 7000 }), [toast]);
  useChangeFeed(on);
  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return (
    <ToastProvider>
      <Feed />
      {children}
    </ToastProvider>
  );
}
