import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

type InBlock = { id: string; name: string; type: string; start_time: string | null; duration_min: number | null; note: string | null; reserved: boolean; travel_min: number | null };
type Body = { mode: 'reflow' | 'late'; dayN: number; city: string; blocks: InBlock[]; removed?: string; moved?: string; now?: string };

const SYSTEM = `당신은 중국(상하이·항저우)을 여행 중인 5인 가족의 일정 도우미입니다.
규칙:
- 예약이 있는 블록(reserved=true)의 시작 시간은 절대 바꾸지 않습니다.
- note(장소 특이사항: 혼잡 시간, 휴무, 마감 등)를 최우선 근거로 씁니다.
- 이동 시간(travel_min)을 고려해 블록이 겹치지 않게 합니다.
- 식사는 되도록 11:30~13:30, 17:30~20:00 사이에 둡니다.
- 답은 한국어, 짧고 구체적으로. 이유는 한 줄.
반드시 JSON만 출력합니다. 다른 글자, 마크다운 금지.
형식: {"options":[{"title":"8~14자","reason":"한 줄","summary":"알림에 쓸 변경 요약 한 줄","changes":[{"id":"블록id","start_time":"HH:MM","duration_min":90,"remove":false}]}]}
changes에는 바뀌는 블록만 넣습니다.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았어요' }, { status: 500 });
  const body = (await req.json()) as Body;
  const task = body.mode === 'late'
    ? `지금 ${body.now}이고 첫 일정 시작 시간보다 늦었습니다. 남은 D${body.dayN}(${body.city}) 일정을 미루거나 줄여서 맞춘 안을 2개 주세요. 첫 안이 가장 추천하는 안입니다.`
    : `D${body.dayN}(${body.city}) 일정에서 ${body.removed ? `'${body.removed}'를 뺐습니다` : `'${body.moved}'의 순서를 바꿨습니다`}. 지금 순서를 바탕으로 빈 시간과 이동을 정리한 안을 2~3개 주세요. 필요하면 근처에서 할 만한 것을 제안해도 되지만 changes에는 기존 블록만 넣습니다.`;
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{ role: 'user', content: `${task}\n\n현재 블록(순서대로):\n${JSON.stringify(body.blocks)}` }],
    });
    const text = msg.content.map((c) => (c.type === 'text' ? c.text : '')).join('');
    const json = JSON.parse(text.replace(/```json|```/g, '').trim());
    const ids = new Set(body.blocks.map((b) => b.id));
    const options = (json.options ?? []).slice(0, 3).map((o: { title: string; reason: string; summary: string; changes: { id: string }[] }) => ({
      ...o,
      changes: (o.changes ?? []).filter((c) => ids.has(c.id)),
    }));
    return NextResponse.json({ options });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'AI가 답하지 못했어요' }, { status: 502 });
  }
}
