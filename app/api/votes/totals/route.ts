import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const matchId = body?.matchId;

    if (!matchId) {
      return NextResponse.json(
        { error: 'matchId is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    const votesSnap = await db
      .collection('votes')
      .where('matchId', '==', matchId)
      .get();

    let teamA = 0;
    let teamB = 0;

    votesSnap.forEach((doc) => {
      const data = doc.data();

      if (data?.prediction === 'teamA') teamA++;
      if (data?.prediction === 'teamB') teamB++;
    });

    // IMPORTANT: match frontend expected shape
    return NextResponse.json({
      totals: {
        teamA,
        teamB,
      },
    });
  } catch (error) {
    console.error('Error in /api/votes/totals:', error);

    return NextResponse.json(
      {
        totals: {
          teamA: 0,
          teamB: 0,
        },
      },
      { status: 200 }
    );
  }
}