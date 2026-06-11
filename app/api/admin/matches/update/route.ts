import { Timestamp } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';

export async function PATCH(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { matchId, startTime, endTime, teamA, teamB } = await request.json();

  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
  }

  const db = getAdminDb();
  const matchRef = db.collection('matches').doc(matchId);
  const matchSnap = await matchRef.get();

  if (!matchSnap.exists) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  const match = matchSnap.data()!;
  if (match.completed) {
    return NextResponse.json({ error: 'Cannot edit a completed match' }, { status: 409 });
  }

  const updates: Record<string, unknown> = {};

  if (startTime) {
    const kickoff = new Date(startTime);
    if (Number.isNaN(kickoff.getTime())) {
      return NextResponse.json({ error: 'Invalid startTime' }, { status: 400 });
    }
    updates.startTime = Timestamp.fromDate(kickoff);
  }

  if (endTime) {
    const end = new Date(endTime);
    if (Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid endTime' }, { status: 400 });
    }
    updates.endTime = Timestamp.fromDate(end);
  }

  if (teamA?.trim()) updates.teamA = teamA.trim();
  if (teamB?.trim()) updates.teamB = teamB.trim();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  await matchRef.update(updates);

  return NextResponse.json({ ok: true, matchId });
}
