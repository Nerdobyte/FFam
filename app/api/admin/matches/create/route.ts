import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';

function slugify(teamA: string, teamB: string) {
  const slug = `${teamA}-vs-${teamB}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${Date.now()}-${slug}`;
}

export async function POST(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { teamA, teamB, startTime, endTime } = await request.json();

  if (!teamA?.trim() || !teamB?.trim() || !startTime) {
    return NextResponse.json({ error: 'teamA, teamB, and startTime are required' }, { status: 400 });
  }

  const kickoff = new Date(startTime);
  if (Number.isNaN(kickoff.getTime())) {
    return NextResponse.json({ error: 'Invalid startTime' }, { status: 400 });
  }

  const end = endTime
    ? new Date(endTime)
    : new Date(kickoff.getTime() + 2 * 60 * 60 * 1000);

  if (Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Invalid endTime' }, { status: 400 });
  }

  const matchId = slugify(teamA.trim(), teamB.trim());
  const db = getAdminDb();

  await db.collection('matches').doc(matchId).set({
    teamA: teamA.trim(),
    teamB: teamB.trim(),
    startTime: Timestamp.fromDate(kickoff),
    endTime: Timestamp.fromDate(end),
    result: null,
    completed: false,
    scored: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    ok: true,
    matchId,
    teamA: teamA.trim(),
    teamB: teamB.trim(),
    startTime: kickoff.toISOString(),
    endTime: end.toISOString(),
  });
}
