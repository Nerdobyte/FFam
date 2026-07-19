import { NextResponse } from 'next/server';
import { getTournamentWinner } from '@/lib/tournament-winner';

export async function GET() {
  const { winnerName } = await getTournamentWinner();
  return NextResponse.json({ winnerName });
}
