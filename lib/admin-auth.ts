import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_session';

export function createAdminToken(secret: string): string {
  return createHmac('sha256', secret).update('admin-session').digest('hex');
}

export async function verifyAdminSession(): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const expected = createAdminToken(secret);
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function setAdminSession(): Promise<void> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error('ADMIN_SECRET is not configured');

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createAdminToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
