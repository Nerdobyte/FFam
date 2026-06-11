import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { aggregateVoteTotals } from '@/lib/server-auth';

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getAdminDb();
  const matchesSnap = await db.collection('matches').orderBy('startTime', 'desc').get();

  const matches = await Promise.all(
    matchesSnap.docs.map(async (matchDoc) => {
      const data = matchDoc.data();
      const votesSnap = await db
        .collection('votes')
        .where('matchId', '==', matchDoc.id)
        .get();

      const votes = votesSnap.docs.map((d) => d.data() as { prediction: string });

      return {
        id: matchDoc.id,
        teamA: data.teamA,
        teamB: data.teamB,
        startTime: data.startTime.toDate().toISOString(),
        endTime: data.endTime.toDate().toISOString(),
        completed: data.completed ?? false,
        scored: data.scored ?? false,
        result: data.result ?? null,
        totals: aggregateVoteTotals(votes),
      };
    }),
  );

  return NextResponse.json({ matches });
}
