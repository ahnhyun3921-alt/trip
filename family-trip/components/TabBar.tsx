'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Icon } from '@/lib/icons';

// 현장 2개(오늘·보여주기) + 준비(일정) + 기록(모음)
const TABS = [
  { href: '/today', label: '오늘', d: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0', match: ['/today'] },
  { href: '/trip', label: '일정', d: 'M4 5h16v15H4zM4 10h16M9 3v4M15 3v4', match: ['/trip', '/day', '/add', '/move', '/taxi'] },
  { href: '/cards', label: '보여주기', d: 'M4 5h16v11H9l-5 4zM8 9h8M8 12.5h5', match: ['/cards', '/toilet'] },
  { href: '/wish', label: '모음', d: 'M6 8h12l-1 12H7L6 8zM9 8a3 3 0 0 1 6 0', match: ['/wish', '/spend'] },
];
// 탭바를 숨기는 화면: 입장, 일정 추가(키보드), 크게 보여주는 카드들
const HIDE = ['/', '/add'];

export default function TabBar() {
  const path = usePathname() || '/';
  const hidden = HIDE.includes(path);
  useEffect(() => {
    document.documentElement.style.setProperty('--tabbar-h', hidden ? '0px' : 'calc(64px + env(safe-area-inset-bottom))');
  }, [hidden]);
  if (hidden) return null;
  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      {TABS.map((t) => {
        const on = t.match.some((m) => path === m || path.startsWith(m + '/'));
        return (
          <Link key={t.href} href={t.href} aria-current={on ? 'page' : undefined}>
            <Icon d={t.d} size={22} stroke={on ? 2 : 1.7} />
            {t.label}
            <span className="tab-dot" />
          </Link>
        );
      })}
    </nav>
  );
}
