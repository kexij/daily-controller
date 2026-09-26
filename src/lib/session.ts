import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';

const secretKey = process.env.JWT_SECRET || 'super-secret-key-for-dev';
const key = new TextEncoder().encode(secretKey);

/**
 * 判断当前会话 Cookie 是否需要带上 Secure 标记。
 *
 * 注意：带 Secure 的 Cookie 只在 HTTPS（或 localhost）下才会被浏览器保存。
 * 直接通过 http://ip:3000 访问时如果带上 Secure，浏览器会直接丢弃，
 * 表现就是「登录提示成功，但刷新后又是未登录、数据读不出来」。
 */
async function useSecureCookie() {
  const override = process.env.SESSION_COOKIE_SECURE;
  if (override === 'true') return true;
  if (override === 'false') return false;

  const requestHeaders = await headers();
  const forwardedProto = requestHeaders
    .get('x-forwarded-proto')
    ?.split(',')[0]
    .trim()
    .toLowerCase();
  if (forwardedProto) return forwardedProto === 'https';

  return requestHeaders.get('x-forwarded-ssl')?.toLowerCase() === 'on';
}

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (error) {
    return null;
  }
}

export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, expires });
  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: await useSecureCookie(),
    expires,
    sameSite: 'lax',
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
