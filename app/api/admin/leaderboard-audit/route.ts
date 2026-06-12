import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import { auditLeaderboard } from '@/lib/reconcile-leaderboard';

export async function POST() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await auditLeaderboard();
  return NextResponse.json({ ok: true, ...result });
}
