import { NextResponse } from 'next/server';
import { setAdminSession } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const { secret } = await request.json();

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Invalid admin secret' }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
