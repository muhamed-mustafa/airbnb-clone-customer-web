import { cookies } from 'next/headers';
import CustomerHome from './customer-home';

export default async function Page() {
  const locale = (await cookies()).get('sakan_locale')?.value === 'en' ? 'en' : 'ar';
  return <CustomerHome initialLocale={locale} />;
}
