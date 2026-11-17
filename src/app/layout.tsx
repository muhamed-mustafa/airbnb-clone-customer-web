import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sakan — stays worth the journey',
  description: 'Discover distinctive homes and plan your next stay.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f8f7f4',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = (await cookies()).get('sakan_locale')?.value === 'en' ? 'en' : 'ar';
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>{children}</body>
    </html>
  );
}
