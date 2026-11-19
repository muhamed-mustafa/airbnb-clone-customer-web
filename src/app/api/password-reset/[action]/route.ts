import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/server/session';

const actions = new Set(['request', 'verify', 'complete']);

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin && origin !== process.env.APP_ORIGIN) {
    return NextResponse.json({ message: 'Request origin is not allowed.' }, { status: 403 });
  }
  const { action } = await context.params;
  if (!actions.has(action)) return NextResponse.json({ message: 'Not found.' }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }
  let upstream: Response;
  try {
    upstream = await fetch(new URL(`/api/auth/password-reset/${action}`, process.env.API_BASE_URL ?? 'http://localhost:3000'), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'accept-language': request.headers.get('accept-language') ?? 'ar' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]),
    });
  } catch {
    return NextResponse.json({ message: 'The service is temporarily unavailable.' }, { status: 503 });
  }
  const response = new NextResponse(upstream.status === 204 ? null : await upstream.text(), {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
  if (action === 'complete' && upstream.ok) {
    response.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0,
    });
  }
  return response;
}
