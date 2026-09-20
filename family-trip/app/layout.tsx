import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: '상하이 · 항저우',
  description: '가족 여행 일정',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: '가족여행', statusBarStyle: 'default' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#ffffff' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <div className="app">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
