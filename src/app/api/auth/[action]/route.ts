import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, sealSession, type UserSession } from '@/server/session';

type Claims = { id?: string; role?: string; exp?: number };
const claims = (token: string): Claims | undefined => {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as Claims;
  } catch {
    return undefined;
  }
};

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const origin = request.headers.get('origin');
  if (origin && origin !== (process.env.APP_ORIGIN ?? request.nextUrl.origin)) {
    return NextResponse.json({ message: 'Request origin is not allowed.' }, { status: 403 });
  }

  const { action } = await context.params;
  if (action === 'logout') {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
      path: '/', maxAge: 0,
    });
    return response;
  }
  if (action !== 'login' && action !== 'register') {
    return NextResponse.json({ message: 'Not found.' }, { status: 404 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(new URL('/api/auth/' + action, process.env.API_BASE_URL ?? 'http://localhost:3000'), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'accept-language': request.headers.get('accept-language') ?? 'ar' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return NextResponse.json({ message: 'The service is temporarily unavailable.' }, { status: 503 });
  }

  const payload: unknown = await upstream.json().catch(() => ({}));
  if (!upstream.ok) return NextResponse.json(payload, { status: upstream.status });
  const envelope = payload as { data?: unknown };
  const tokens = (envelope.data ?? payload) as { accessToken?: unknown; refreshToken?: unknown };
  if (typeof tokens.accessToken !== 'string' || typeof tokens.refreshToken !== 'string') {
    return NextResponse.json({ message: 'Unexpected authentication response.' }, { status: 502 });
  }
  const access = claims(tokens.accessToken);
  const refresh = claims(tokens.refreshToken);
  if (access?.role !== 'user' || typeof access.id !== 'string' || typeof access.exp !== 'number' || typeof refresh?.exp !== 'number') {
    return NextResponse.json({ message: 'Unexpected authentication response.' }, { status: 502 });
  }
  const session: UserSession = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessExp: access.exp,
    refreshExp: refresh.exp,
    userId: access.id,
  };
  const sealed = await sealSession(session);
  const response = NextResponse.json({ ok: true, userId: session.userId }, { status: upstream.status });
  response.cookies.set(SESSION_COOKIE, sealed.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sealed.maxAge,
  });
  return response;
}
