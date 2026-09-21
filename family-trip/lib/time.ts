// '1시간 30분', '90분', '1.5시간', '2h', '40' → 분
export function parseDuration(text: string | null | undefined): number | null {
  if (!text) return null;
  const t = text.replace(/\s/g, '').replace(/쯤|정도|약/g, '');
  let total = 0;
  let hit = false;
  const h = t.match(/(\d+(?:\.\d+)?)(시간|h|H)/);
  if (h) { total += parseFloat(h[1]) * 60; hit = true; }
  const m = t.match(/(\d+)(분|m|M|min)/);
  if (m) { total += parseInt(m[1], 10); hit = true; }
  if (!hit && /^\d+$/.test(t)) { total = parseInt(t, 10); hit = true; }
  if (!hit && /반/.test(t)) { total = 30; hit = true; }
  if (/시간반/.test(t)) total += 30;
  return hit ? Math.round(total) : null;
}

export function toMin(hhmm: string | null | undefined): number | null {
  if (!hhmm) return null;
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
}

export function fromMin(min: number): string {
  const h = Math.floor(((min % 1440) + 1440) % 1440 / 60);
  const m = ((min % 60) + 60) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function nowMin(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function rangeText(start: string | null, dur: number | null): string {
  const s = toMin(start);
  if (s == null) return '';
  return dur ? `${start} – ${fromMin(s + dur)}` : start!;
}

const WD = ['일', '월', '화', '수', '목', '금', '토'];
// '2026-12-20' → '12/20 (일)'
export function dateLabel(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${Number(m[2])}/${Number(m[3])} (${WD[d.getDay()]})`;
}
