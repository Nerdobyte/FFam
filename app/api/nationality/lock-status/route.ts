import { NextResponse } from 'next/server';
import {
  getNationalityLockSettings,
  isNationalityLocked,
} from '@/lib/nationality-lock';
import { WORLD_CUP_TEAMS } from '@/lib/world-cup-teams';

export async function GET() {
  const { lockAt } = await getNationalityLockSettings();
  const locked = isNationalityLocked(lockAt);

  return NextResponse.json({
    lockAt: lockAt?.toISOString() ?? null,
    locked,
    teams: WORLD_CUP_TEAMS,
  });
}
