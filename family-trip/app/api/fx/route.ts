import { NextResponse } from 'next/server';

// 위안 → 원 환율 (키 없이 쓰는 공개 환율 API)
export const revalidate = 21600; // 6시간

export async function GET() {
  try {
    const r = await fetch('https://api.frankfurter.app/latest?from=CNY&to=KRW', { next: { revalidate } });
    const j = await r.json();
    const rate = j?.rates?.KRW;
    if (!rate) throw new Error('환율을 못 받았어요');
    return NextResponse.json({ rate, date: j.date });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '환율을 못 받았어요' }, { status: 502 });
  }
}
