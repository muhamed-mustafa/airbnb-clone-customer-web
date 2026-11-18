import { cookies } from 'next/headers';
import CustomerHome from './customer-home';
import { readSession } from '../server/session';

type PageSearchParams = Record<string, string | string[] | undefined>;

export default async function Page({ searchParams }: { searchParams: Promise<PageSearchParams> }) {
  const locale = (await cookies()).get('sakan_locale')?.value === 'en' ? 'en' : 'ar';
  const session = await readSession();
  const initialSignedIn = Boolean(session);
  const search = await searchParams;
  const initialSearchParams = Object.fromEntries(
    Object.entries(search).flatMap(([key, value]) => typeof value === 'string' ? [[key, value]] : []),
  );
  return <CustomerHome initialLocale={locale} initialSignedIn={initialSignedIn} initialSearchParams={initialSearchParams} />;
}
