import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import { SettleMatchError, settleMatch } from '@/lib/settle-match';

/** Re-score a match that has a result but was never settled (scored == false). */
export async function POST(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { matchId } = await request.json();

  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
  }

  try {
    const result = await settleMatch(matchId);

    return NextResponse.json({
      ok: true,
      pointsAwarded: result.pointsAwarded,
      voters: result.voters,
    });
  } catch (err) {
    if (err instanceof SettleMatchError) {
      const status =
        err.code === 'NOT_FOUND' ? 404 : err.code === 'ALREADY_SCORED' ? 409 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    throw err;
  }
}
