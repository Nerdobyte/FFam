import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { aggregateVoteTotals, verifyFamilyUser } from '@/lib/server-auth';

export async function POST(request: Request) {
  const { matchId, userId } = await request.json();

  if (!matchId || !userId) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const verified = await verifyFamilyUser(request, userId);
  if (!verified) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getAdminDb();
  const voteSnap = await db.collection('votes').doc(`${matchId}_${userId}`).get();

  if (!voteSnap.exists) {
    return NextResponse.json({ error: 'Vote required to view community results' }, { status: 403 });
  }

  const votesSnap = await db.collection('votes').where('matchId', '==', matchId).get();
  const totals = aggregateVoteTotals(
    votesSnap.docs.map((d) => d.data() as { prediction: string }),
  );

  return NextResponse.json({ totals });
}
