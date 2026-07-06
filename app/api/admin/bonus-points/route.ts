import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import {
  awardBonusPoints,
  BonusPointError,
  listBonusPointAwards,
} from '@/lib/bonus-points';

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const awards = await listBonusPointAwards();
  return NextResponse.json({ awards });
}

export async function POST(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const award = await awardBonusPoints({
      userId: body.userId,
      matchId: body.matchId,
      points: body.points,
      reason: body.reason,
    });
    return NextResponse.json({ ok: true, award });
  } catch (err) {
    if (err instanceof BonusPointError) {
      const status =
        err.code === 'USER_NOT_FOUND' || err.code === 'MATCH_NOT_FOUND' ? 404 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    throw err;
  }
}
