import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  const guestSession = request.cookies.get('guest_session');

  // 如果已登录真实账号，直接放行
  if (session) {
    return NextResponse.next();
  }

  // 若已有访客沙盒会话，透传到下游请求头
  if (guestSession?.value) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-guest-session', guestSession.value);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 既无真实账号也无访客会话（如首次打开或刚清理缓存）：分配全新的访客沙盒 ID
  const newGuestId = `guest_${crypto.randomUUID()}`;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-guest-session', newGuestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 在客户端 Cookie 中存入该访客会话，有效期 30 天
  response.cookies.set('guest_session', newGuestId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

export const config = {
  // 匹配所有页面路由，忽略 API、静态资源、图标等
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.webmanifest).*)',
  ],
};
