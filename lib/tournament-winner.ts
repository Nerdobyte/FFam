import { getAdminDb } from './firebase-admin';

const SETTINGS_DOC = 'tournament';

export interface TournamentWinnerSettings {
  winnerName: string | null;
}

export async function getTournamentWinner(): Promise<TournamentWinnerSettings> {
  const snap = await getAdminDb().collection('settings').doc(SETTINGS_DOC).get();
  if (!snap.exists) return { winnerName: null };

  const raw = snap.data()?.winnerName;
  if (typeof raw !== 'string') return { winnerName: null };
  const trimmed = raw.trim();
  return { winnerName: trimmed || null };
}

export async function setTournamentWinner(winnerName: string | null): Promise<void> {
  const value = winnerName?.trim() || null;
  await getAdminDb()
    .collection('settings')
    .doc(SETTINGS_DOC)
    .set({ winnerName: value }, { merge: true });
}
