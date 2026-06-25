import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import { formatUkDateTime } from '@/lib/datetime';
import {
  getNationalityLockSettings,
  isNationalityLocked,
  setNationalityLockAt,
} from '@/lib/nationality-lock';

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { lockAt } = await getNationalityLockSettings();
  const locked = isNationalityLocked(lockAt);

  return NextResponse.json({
    lockAt: lockAt?.toISOString() ?? null,
    lockAtLabel: lockAt ? formatUkDateTime(lockAt) : null,
    locked,
    status: locked ? 'Locked' : 'Active',
  });
}

export async function POST(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const lockAtInput = body?.lockAt as string | undefined;

  if (!lockAtInput) {
    return NextResponse.json({ error: 'lockAt is required' }, { status: 400 });
  }

  try {
    const lockAt = new Date(lockAtInput);
    if (Number.isNaN(lockAt.getTime())) {
      return NextResponse.json({ error: 'Invalid lockAt value' }, { status: 400 });
    }
    await setNationalityLockAt(lockAt);

    const locked = isNationalityLocked(lockAt);

    return NextResponse.json({
      ok: true,
      lockAt: lockAt.toISOString(),
      lockAtLabel: formatUkDateTime(lockAt),
      locked,
      status: locked ? 'Locked' : 'Active',
    });
  } catch {
    return NextResponse.json({ error: 'Invalid lockAt value' }, { status: 400 });
  }
}
