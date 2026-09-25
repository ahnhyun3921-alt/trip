'use client';
import { useCallback, useEffect, useState } from 'react';
import { sb } from './supabase';
import type { Block, Change, Day, Expense } from './types';

// ---------- 나 (입장한 사람) ----------
const ME_KEY = 'trip.me';
export function useMe() {
  const [me, setMeState] = useState<string | null | undefined>(undefined);
  useEffect(() => setMeState(localStorage.getItem(ME_KEY)), []);
  const setMe = useCallback((name: string) => { localStorage.setItem(ME_KEY, name); setMeState(name); }, []);
  const logout = useCallback(() => { localStorage.removeItem(ME_KEY); setMeState(null); }, []);
  return { me, setMe, logout };
}
export function currentMe(): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem(ME_KEY);
}

// ---------- 오프라인 캐시 ----------
function readCache<T>(key: string): T | null {
  try { const v = localStorage.getItem('cache.' + key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function writeCache(key: string, v: unknown) {
  try { localStorage.setItem('cache.' + key, JSON.stringify(v)); } catch { /* 가득 참: 무시 */ }
}

function useLive<T>(key: string, load: () => Promise<T>, tables: { table: string; filter?: string }[], enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      const v = await load();
      setData(v); writeCache(key, v); setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했어요');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (!enabled) return;
    const cached = readCache<T>(key);
    if (cached) setData(cached);
    refresh();
    const ch = sb().channel('live-' + key + '-' + Math.random().toString(36).slice(2));
    tables.forEach((t) =>
      ch.on('postgres_changes' as never, { event: '*', schema: 'public', table: t.table, ...(t.filter ? { filter: t.filter } : {}) } as never, () => refresh())
    );
    ch.subscribe();
    const onOnline = () => refresh();
    window.addEventListener('online', onOnline);
    return () => { sb().removeChannel(ch); window.removeEventListener('online', onOnline); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
  return { data, error, refresh, setData };
}

export function useDays() {
  return useLive<Day[]>('days', async () => {
    const { data, error } = await sb().from('days').select('*').order('n');
    if (error) throw error;
    return data as Day[];
  }, [{ table: 'days' }]);
}

export function useBlocks(dayId: string | undefined) {
  return useLive<Block[]>('blocks.' + dayId, async () => {
    const { data, error } = await sb().from('blocks').select('*').eq('day_id', dayId!).order('position');
    if (error) throw error;
    return data as Block[];
  }, [{ table: 'blocks', filter: `day_id=eq.${dayId}` }], !!dayId);
}

export function useBlock(id: string | undefined) {
  return useLive<Block | null>('block.' + id, async () => {
    const { data, error } = await sb().from('blocks').select('*').eq('id', id!).maybeSingle();
    if (error) throw error;
    return data as Block | null;
  }, [{ table: 'blocks', filter: `id=eq.${id}` }], !!id);
}

export function useReservations() {
  return useLive<(Block & { day_n: number })[]>('reservations', async () => {
    const { data, error } = await sb().from('blocks').select('*, days(n)').not('reservation', 'is', null).order('start_time');
    if (error) throw error;
    return (data as (Block & { days: { n: number } })[])
      .map((b) => ({ ...b, day_n: b.days?.n ?? 0 }))
      .sort((a, b) => a.day_n - b.day_n || (a.start_time ?? '').localeCompare(b.start_time ?? ''));
  }, [{ table: 'blocks' }]);
}

export function useExpenses() {
  return useLive<Expense[]>('expenses', async () => {
    const { data, error } = await sb().from('expenses').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as Expense[];
  }, [{ table: 'expenses' }]);
}

// ---------- 쓰기 ----------
export async function updateBlock(id: string, patch: Partial<Block>) {
  const { error } = await sb().from('blocks').update({ ...patch, updated_by: currentMe(), updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
export async function updateDay(id: string, patch: Partial<Day>) {
  const { error } = await sb().from('days').update(patch).eq('id', id);
  if (error) throw error;
}
export async function insertBlock(b: Partial<Block>) {
  const { data, error } = await sb().from('blocks').insert({ ...b, updated_by: currentMe() }).select().single();
  if (error) throw error;
  return data as Block;
}
export async function deleteBlock(id: string) {
  const { error } = await sb().from('blocks').delete().eq('id', id);
  if (error) throw error;
}
export async function restoreBlock(b: Block) {
  const { error } = await sb().from('blocks').insert(b);
  if (error) throw error;
}
export async function reorderBlocks(ids: string[]) {
  await Promise.all(ids.map((id, i) => sb().from('blocks').update({ position: i }).eq('id', id)));
}
export async function logChange(dayN: number | null, summary: string) {
  await sb().from('changes').insert({ day_n: dayN, summary, actor: currentMe() });
}
export async function addExpense(e: Partial<Expense>) {
  const { error } = await sb().from('expenses').insert({ ...e, created_by: currentMe() });
  if (error) throw error;
}
export async function uploadCapture(file: File): Promise<string> {
  const path = `${Date.now()}-${file.name.replace(/[^\w.]/g, '_')}`;
  const { error } = await sb().storage.from('captures').upload(path, file, { upsert: false });
  if (error) throw error;
  return sb().storage.from('captures').getPublicUrl(path).data.publicUrl;
}

// ---------- 변경 알림 (다른 가족이 바꾼 것만) ----------
export function useChangeFeed(onChange: (c: Change) => void) {
  useEffect(() => {
    const ch = sb().channel('changes-feed')
      .on('postgres_changes' as never, { event: 'INSERT', schema: 'public', table: 'changes' } as never, (p: { new: Change }) => {
        if (p.new.actor !== currentMe()) onChange(p.new);
      })
      .subscribe();
    return () => { sb().removeChannel(ch); };
  }, [onChange]);
}

// ---------- 사갈 것·먹을 것 모음 (편의점 / 기념품 / 배달) ----------
export type Wish = { id: string; cat: 'store' | 'gift' | 'delivery'; ko: string; brand: string | null; forwho: string | null; done: boolean; by: string | null; created_at: string };

export function useWishes() {
  return useLive<Wish[]>('wishes', async () => {
    const { data, error } = await sb().from('wishes').select('*').order('created_at');
    if (error) throw error;
    return data as Wish[];
  }, [{ table: 'wishes' }]);
}
export async function addWish(w: Partial<Wish>) {
  const { error } = await sb().from('wishes').insert({ ...w, by: currentMe() });
  if (error) throw error;
}
export async function updateWish(id: string, patch: Partial<Wish>) {
  const { error } = await sb().from('wishes').update(patch).eq('id', id);
  if (error) throw error;
}
export async function deleteWish(id: string) {
  const { error } = await sb().from('wishes').delete().eq('id', id);
  if (error) throw error;
}
