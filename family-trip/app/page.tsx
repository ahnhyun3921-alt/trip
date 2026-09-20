'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { MEMBERS } from '@/lib/members';
import { useMe } from '@/lib/data';
import { Face, Icon, P } from '@/lib/icons';

function Pick() {
  const { me, setMe, logout } = useMe();
  const router = useRouter();
  const switching = useSearchParams().get('switch') === '1';
  useEffect(() => { if (me && !switching) router.replace('/trip'); }, [me, switching, router]);
  if (me === undefined) return null;
  return (
    <main className="page" style={{ padding: '64px 20px 40px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div className="head" style={{ padding: 0, gap: 8 }}>
        <h1 className="big">시작해봐요!</h1>
        <div className="meta"><span>한 번 고르면 로그아웃 전까지 그대로 들어와요</span></div>
      </div>
      <nav aria-label="가족 선택" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MEMBERS.map((m) => {
          const mine = m.name === me;
          return (
            <button key={m.name} onClick={() => { setMe(m.name); router.replace('/trip'); }}
              style={{ minHeight: 84, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px 12px 12px', background: 'var(--surface)', border: mine ? '1.5px solid var(--ink)' : '1.5px solid var(--surface)', borderRadius: 26, textAlign: 'left' }}>
              <span style={{ width: 60, height: 60, borderRadius: 22, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Face d={m.face} size={40} /></span>
              <b style={{ flexGrow: 1, fontSize: 19 }}>{m.name}</b>
              {mine ? <span style={{ fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 999, background: '#fff' }}>이 기기</span> : <Icon d={P.chev} size={18} color="#9a9aa0" stroke={2} />}
            </button>
          );
        })}
      </nav>
      {me && <button className="btn soft" onClick={logout}>로그아웃</button>}
    </main>
  );
}

export default function Page() {
  return <Suspense><Pick /></Suspense>;
}
