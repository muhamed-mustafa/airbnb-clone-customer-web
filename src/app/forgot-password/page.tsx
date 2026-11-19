import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import RecoveryClient from './recovery-client';

export const metadata: Metadata = { title: 'استعادة كلمة المرور | ULFA', description: 'استعد الوصول إلى حسابك في أُلفة بأمان.' };

export default async function ForgotPasswordPage() {
  const locale = (await cookies()).get('sakan_locale')?.value === 'en' ? 'en' : 'ar';
  return <RecoveryClient initialLocale={locale} />;
}
