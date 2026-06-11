import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import { SettleMatchError, repairSettleMatch } from '@/lib/settle-match';

/** Re-apply scoring when match is scored but user points were never updated. */
export async function POST(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { matchId } = await request.json();

  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
  }

  try {
    const result = await repairSettleMatch(matchId);

    return NextResponse.json({
      ok: true,
      repaired: true,
      pointsAwarded: result.pointsAwarded,
      voters: result.voters,
      voterIds: result.voterIds,
      winner: result.result === 'teamA' ? result.teamA : result.teamB,
    });
  } catch (err) {
    if (err instanceof SettleMatchError) {
      const status =
        err.code === 'NOT_FOUND'
          ? 404
          : err.code === 'ALREADY_SCORED'
            ? 409
            : err.code === 'NO_VOTES'
              ? 400
              : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    throw err;
  }
}
