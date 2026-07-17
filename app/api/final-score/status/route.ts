import { NextResponse } from 'next/server';
import { formatUkDateTime } from '@/lib/datetime';
import { getFinalScoreSettings, isFinalScoreLocked } from '@/lib/final-score-prediction';

export async function GET() {
  const settings = await getFinalScoreSettings();
  const locked = isFinalScoreLocked(settings);

  return NextResponse.json({
    enabled: settings.enabled,
    locked,
    lockTime: settings.lockTime?.toISOString() ?? null,
    lockTimeLabel: settings.lockTime ? formatUkDateTime(settings.lockTime) : null,
    finalTeamA: settings.finalTeamA,
    finalTeamB: settings.finalTeamB,
  });
}
