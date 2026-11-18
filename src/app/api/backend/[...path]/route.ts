import { NextResponse, type NextRequest } from 'next/server';
import { readSession, sealSession, SESSION_COOKIE, type UserSession } from '@/server/session';

type Claims = { id?: string; role?: string; exp?: number };
const parseClaims = (token: string): Claims | undefined => {
  try { return JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as Claims; }
  catch { return undefined; }
};

function isCustomerOperation(method: string, segments: string[]) {
  const path = segments.join('/');
  const objectId = '[a-fA-F0-9]{24}';
  if (method === 'GET') {
    return ['auth/me', 'countries', 'cities', 'unit-categories', 'units', 'units/me',
      'bookings/me', 'bookings/check-availability'].includes(path) ||
      new RegExp('^units/' + objectId + '$').test(path) ||
      new RegExp('^bookings/' + objectId + '$').test(path);
  }
  if (method === 'POST') return path === 'units' || path === 'bookings';
  if (method === 'PATCH') {
    return new RegExp('^units/' + objectId + '$').test(path) ||
      new RegExp('^units/' + objectId + '/(activate|deactivate)$').test(path);
  }
  return method === 'DELETE' && new RegExp('^units/' + objectId + '$').test(path);
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!isCustomerOperation(request.method, path)) {
    return NextResponse.json({ message: 'This operation is not available.' }, { status: 404 });
  }
  const endpoint = '/' + path.join('/');
  const method = request.method;
  const isWrite = method !== 'GET' && method !== 'HEAD';
  const origin = request.headers.get('origin');
  if (isWrite && origin && origin !== request.nextUrl.origin && origin !== process.env.APP_ORIGIN) {
    return NextResponse.json({ message: 'Request origin is not allowed.' }, { status: 403 });
  }

  const url = new URL('/api' + endpoint, process.env.API_BASE_URL ?? 'http://localhost:3000');
  url.search = request.nextUrl.search;
  const headers = new Headers({
    accept: 'application/json',
    'accept-language': request.headers.get('accept-language') ?? 'ar',
  });
  const session = await readSession();
  if (session) headers.set('authorization', 'Bearer ' + session.accessToken);
  if (isWrite) headers.set('content-type', request.headers.get('content-type') ?? 'application/json');
  const body = isWrite ? await request.text() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method, headers, body, cache: 'no-store', signal: AbortSignal.any([request.signal, AbortSignal.timeout(10000)]),
    });
  } catch {
    return NextResponse.json({ message: 'The service is temporarily unavailable.' }, { status: 503 });
  }

  let updatedSession: UserSession | undefined;
  let sessionRejected = false;
  if (upstream.status === 401 && session) {
    try {
      const refreshed = await fetch(new URL('/api/auth/refresh-token', process.env.API_BASE_URL ?? 'http://localhost:3000'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: session.refreshToken }),
        cache: 'no-store',
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(10000)]),
      });
      if (refreshed.ok) {
        const refreshBody = await refreshed.json() as { data?: unknown };
        const pair = (refreshBody.data ?? refreshBody) as { accessToken?: string; refreshToken?: string };
        if (pair.accessToken && pair.refreshToken) {
          const access = parseClaims(pair.accessToken);
          const refresh = parseClaims(pair.refreshToken);
          if (access?.role === 'user' && access.id === session.userId && typeof access.exp === 'number' && typeof refresh?.exp === 'number') {
            updatedSession = { ...session, accessToken: pair.accessToken, refreshToken: pair.refreshToken, accessExp: access.exp, refreshExp: refresh.exp };
            headers.set('authorization', 'Bearer ' + pair.accessToken);
            upstream = await fetch(url, { method, headers, body, cache: 'no-store', signal: AbortSignal.any([request.signal, AbortSignal.timeout(10000)]) });
          }
        }
      } else if (refreshed.status === 401) {
        sessionRejected = true;
      }
    } catch {
      // The caller receives the original auth response and can sign in again.
    }
  }

  const responseBody = upstream.status === 204 ? null : await upstream.text();
  const response = new NextResponse(responseBody, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
  if (updatedSession) {
    const sealed = await sealSession(updatedSession);
    response.cookies.set(SESSION_COOKIE, sealed.value, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
      path: '/', maxAge: sealed.maxAge,
    });
  } else if (sessionRejected) {
    response.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
      path: '/', maxAge: 0,
    });
  }
  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
