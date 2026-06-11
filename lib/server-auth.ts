import { getAuth } from 'firebase-admin/auth';
import { getAdminDb } from './firebase-admin';

export async function verifyFamilyUser(
  request: Request,
  userId: string,
): Promise<{ uid: string; userId: string } | null> {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;

  try {
    const token = header.slice(7);
    const decoded = await getAuth().verifyIdToken(token);
    const db = getAdminDb();
    const userSnap = await db.collection('users').doc(userId).get();

    if (!userSnap.exists || userSnap.data()?.authUid !== decoded.uid) {
      return null;
    }

    return { uid: decoded.uid, userId };
  } catch {
    return null;
  }
}

export function aggregateVoteTotals(
  votes: { prediction: string }[],
): { teamA: number; teamB: number } {
  return votes.reduce(
    (acc, vote) => {
      if (vote.prediction === 'teamA') acc.teamA += 1;
      else if (vote.prediction === 'teamB') acc.teamB += 1;
      return acc;
    },
    { teamA: 0, teamB: 0 },
  );
}
