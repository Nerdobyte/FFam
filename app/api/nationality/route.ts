import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import {
  getNationalityLockSettings,
  isNationalityLocked,
} from '@/lib/nationality-lock';
import { verifyFamilyUser } from '@/lib/server-auth';
import { isValidWorldCupTeam } from '@/lib/world-cup-teams';

const LOCKED_MESSAGE = 'Nationality selection is now locked.';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body?.userId as string | undefined;
    const nationality = body?.nationality as string | undefined;

    if (!userId || !nationality?.trim()) {
      return NextResponse.json({ error: 'userId and nationality are required' }, { status: 400 });
    }

    const session = await verifyFamilyUser(request, userId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trimmed = nationality.trim();
    if (!isValidWorldCupTeam(trimmed)) {
      return NextResponse.json({ error: 'Invalid nationality' }, { status: 400 });
    }

    const { lockAt } = await getNationalityLockSettings();
    if (isNationalityLocked(lockAt)) {
      return NextResponse.json({ error: LOCKED_MESSAGE }, { status: 403 });
    }

    await getAdminDb().collection('users').doc(userId).update({ nationality: trimmed });

    return NextResponse.json({ ok: true, nationality: trimmed });
  } catch (error) {
    console.error('Error in /api/nationality:', error);
    return NextResponse.json({ error: 'Failed to save nationality' }, { status: 500 });
  }
}
