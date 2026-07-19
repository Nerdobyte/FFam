import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import { getTournamentWinner, setTournamentWinner } from '@/lib/tournament-winner';

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { winnerName } = await getTournamentWinner();
  return NextResponse.json({ winnerName });
}

export async function POST(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const raw = body?.winnerName;
  if (raw !== null && typeof raw !== 'string') {
    return NextResponse.json({ error: 'winnerName must be a string' }, { status: 400 });
  }

  const winnerName = typeof raw === 'string' ? raw.trim() || null : null;
  await setTournamentWinner(winnerName);

  return NextResponse.json({ ok: true, winnerName });
}
