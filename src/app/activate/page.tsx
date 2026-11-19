import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import ActivationClient from './activation-client';

export const metadata: Metadata = { title: 'تفعيل الحساب | ULFA', description: 'فعّل بريدك الإلكتروني للانضمام إلى أُلفة.' };

export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const locale = (await cookies()).get('sakan_locale')?.value === 'en' ? 'en' : 'ar';
  const { email } = await searchParams;
  return <ActivationClient initialLocale={locale} initialEmail={typeof email === 'string' ? email.slice(0, 254) : ''} />;
}
