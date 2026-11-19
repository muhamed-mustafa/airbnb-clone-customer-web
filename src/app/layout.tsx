import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';

const arabic = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-arabic' });
const latin = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-latin' });

export const metadata: Metadata = {
  title: 'ULFA | أُلفة — مكان تحسّه مكانك',
  description: 'Discover places that feel like yours. Explore stays and book with confidence on ULFA.',
  applicationName: 'ULFA',
  openGraph: { title: 'ULFA | أُلفة', description: 'مكان تحسّه مكانك. Find a place that feels like yours.', type: 'website' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f7f5f1',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = (await cookies()).get('sakan_locale')?.value === 'en' ? 'en' : 'ar';
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body className={`${arabic.variable} ${latin.variable}`}>{children}</body>
    </html>
  );
}
