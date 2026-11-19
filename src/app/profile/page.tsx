import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSession } from '../../server/session';
import ProfileClient from './profile-client';

export const metadata: Metadata = { title: 'حسابي | ULFA', description: 'إدارة حسابك في أُلفة.' };

export default async function ProfilePage() {
  const session = await readSession();
  if (!session) redirect('/');
  const locale = (await cookies()).get('sakan_locale')?.value === 'en' ? 'en' : 'ar';
  return <ProfileClient initialLocale={locale} />;
}
