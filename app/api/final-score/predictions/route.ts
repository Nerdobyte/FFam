import { NextResponse } from 'next/server';
import {
  getFinalScoreSettings,
  isFinalScoreLocked,
  listFinalScorePredictions,
} from '@/lib/final-score-prediction';
import { verifyFamilyUser } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
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

    // Only reveal everyone's predictions after the lock has been applied.
    if (!isFinalScoreLocked(settings)) {
      return NextResponse.json(
        { error: 'Predictions are only visible after lock' },
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
