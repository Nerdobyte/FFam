import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import { formatUkDateTime } from '@/lib/datetime';
import {
  getFinalScoreSettings,
  isFinalScoreLocked,
  saveFinalScoreSettings,
} from '@/lib/final-score-prediction';

function serialize(settings: Awaited<ReturnType<typeof getFinalScoreSettings>>) {
  const locked = isFinalScoreLocked(settings);
  return {
    enabled: settings.enabled,
    manualLocked: settings.locked,
    locked,
    lockTime: settings.lockTime?.toISOString() ?? null,
    lockTimeLabel: settings.lockTime ? formatUkDateTime(settings.lockTime) : null,
    finalTeamA: settings.finalTeamA,
    finalTeamB: settings.finalTeamB,
    status: locked ? 'Locked' : 'Open',
  };
}

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getFinalScoreSettings();
  return NextResponse.json(serialize(settings));
}

export async function POST(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const lockedInput = body?.locked;
  const lockTimeInput = body?.lockTime as string | undefined;
  const finalTeamA = (body?.finalTeamA as string | undefined)?.trim();
  const finalTeamB = (body?.finalTeamB as string | undefined)?.trim();

  if (typeof lockedInput !== 'boolean') {
    return NextResponse.json({ error: 'locked boolean is required' }, { status: 400 });
  }
  if (!finalTeamA || !finalTeamB) {
    return NextResponse.json({ error: 'Both team names are required' }, { status: 400 });
  }

  let lockTime: Date | null = null;
  if (lockTimeInput) {
    lockTime = new Date(lockTimeInput);
    if (Number.isNaN(lockTime.getTime())) {
      return NextResponse.json({ error: 'Invalid lockTime value' }, { status: 400 });
    }
  }

  await saveFinalScoreSettings({ locked: lockedInput, lockTime, finalTeamA, finalTeamB });

  const settings = await getFinalScoreSettings();
  return NextResponse.json({ ok: true, ...serialize(settings) });
}
