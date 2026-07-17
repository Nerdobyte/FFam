import { NextResponse } from 'next/server';
import {
  getFinalScorePrediction,
  getFinalScoreSettings,
  isFinalScoreLocked,
  saveFinalScorePrediction,
} from '@/lib/final-score-prediction';
import { verifyFamilyUser } from '@/lib/server-auth';

const LOCKED_MESSAGE = 'Final score predictions are now locked.';
const MAX_SCORE = 99;

function isValidScore(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= MAX_SCORE;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body?.userId as string | undefined;
    const scoreTeamA = body?.scoreTeamA;
    const scoreTeamB = body?.scoreTeamB;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const session = await verifyFamilyUser(request, userId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isValidScore(scoreTeamA) || !isValidScore(scoreTeamB)) {
      return NextResponse.json(
        { error: `Scores must be whole numbers between 0 and ${MAX_SCORE}` },
        { status: 400 },
      );
    }

    const settings = await getFinalScoreSettings();
    if (!settings.enabled) {
      return NextResponse.json({ error: 'Final score prediction is not available' }, { status: 403 });
    }

    // Server-authoritative lock check using the server clock, not the browser.
    if (isFinalScoreLocked(settings)) {
      return NextResponse.json({ error: LOCKED_MESSAGE }, { status: 403 });
    }

    await saveFinalScorePrediction(userId, scoreTeamA, scoreTeamB);
    const saved = await getFinalScorePrediction(userId);

    return NextResponse.json({
      ok: true,
      scoreTeamA: saved?.scoreTeamA ?? scoreTeamA,
      scoreTeamB: saved?.scoreTeamB ?? scoreTeamB,
    });
  } catch (error) {
    console.error('Error in /api/final-score:', error);
    return NextResponse.json({ error: 'Failed to save prediction' }, { status: 500 });
  }
}
