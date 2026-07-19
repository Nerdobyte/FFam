import { NextResponse } from 'next/server';
import {
  getFinalScoreSettings,
  isFinalScoreLocked,
  listFinalScorePredictions,
} from '@/lib/final-score-prediction';
import { verifyFamilyUser } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body?.userId as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const session = await verifyFamilyUser(request, userId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getFinalScoreSettings();
    if (!settings.enabled) {
      return NextResponse.json({ error: 'Final score prediction is not available' }, { status: 403 });
    }

    // Predictions stay private until the lock is applied (server clock).
    if (!isFinalScoreLocked(settings)) {
      return NextResponse.json(
        { error: 'Predictions are only visible after the lock' },
        { status: 403 },
      );
    }

    const predictions = await listFinalScorePredictions();

    return NextResponse.json({
      predictions,
      finalTeamA: settings.finalTeamA,
      finalTeamB: settings.finalTeamB,
    });
  } catch (error) {
    console.error('Error in /api/final-score/predictions:', error);
    return NextResponse.json({ error: 'Failed to load predictions' }, { status: 500 });
  }
}
