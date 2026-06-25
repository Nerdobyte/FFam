import { NextResponse } from 'next/server';
import { formatUkDateTime } from '@/lib/datetime';
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
    lockAtLabel: lockAt ? formatUkDateTime(lockAt) : null,
    locked,
    teams: WORLD_CUP_TEAMS,
  });
}
