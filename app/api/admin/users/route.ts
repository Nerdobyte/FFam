import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getAdminDb();
  const usersSnap = await db.collection('users').get();

  const users = usersSnap.docs
    .map((doc) => ({
      id: doc.id,
      name: (doc.data().name as string) ?? doc.id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ users });
}
