import { sealData, unsealData } from 'iron-session';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'stays_customer_session';

export interface UserSession {
  accessToken: string;
  refreshToken: string;
  accessExp: number;
  refreshExp: number;
  userId: string;
}

const secret = () => {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET must contain 32 characters.');
  return value;
};

export async function readSession(): Promise<UserSession | undefined> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return undefined;
  try {
    const data = await unsealData<unknown>(value, { password: secret() });
    if (!data || typeof data !== 'object') return undefined;
    const session = data as Partial<UserSession>;
    if (
      typeof session.accessToken !== 'string' ||
      typeof session.refreshToken !== 'string' ||
      typeof session.userId !== 'string' ||
      typeof session.accessExp !== 'number' ||
      typeof session.refreshExp !== 'number'
    ) return undefined;
    return session as UserSession;
  } catch {
    return undefined;
  }
}

export async function sealSession(session: UserSession) {
  const maxAge = Math.max(0, session.refreshExp - Math.floor(Date.now() / 1000));
  return { value: await sealData(session, { password: secret(), ttl: maxAge }), maxAge };
}
