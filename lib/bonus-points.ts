import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from './firebase-admin';

export interface BonusPointAward {
  id: string;
  userId: string;
  userName: string;
  matchId: string;
  matchLabel: string;
  points: number;
  reason: string | null;
  createdAt: string;
}

export class BonusPointError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'INVALID' | 'USER_NOT_FOUND' | 'MATCH_NOT_FOUND',
  ) {
    super(message);
    this.name = 'BonusPointError';
  }
}

/** Sum bonus points per userId from the bonusPoints collection. */
export async function getBonusPointsByUser(): Promise<Map<string, number>> {
  const db = getAdminDb();
  const snap = await db.collection('bonusPoints').get();
  const byUser = new Map<string, number>();

  for (const doc of snap.docs) {
    const data = doc.data();
    const userId = data.userId as string | undefined;
    const points = data.points as number | undefined;
    if (!userId || typeof points !== 'number') continue;
    byUser.set(userId, (byUser.get(userId) ?? 0) + points);
  }

  return byUser;
}

export async function listBonusPointAwards(): Promise<BonusPointAward[]> {
  const db = getAdminDb();

  const [bonusSnap, usersSnap, matchesSnap] = await Promise.all([
    db.collection('bonusPoints').orderBy('createdAt', 'desc').get(),
    db.collection('users').get(),
    db.collection('matches').get(),
  ]);

  const userNames = new Map<string, string>();
  for (const doc of usersSnap.docs) {
    userNames.set(doc.id, (doc.data().name as string) ?? doc.id);
  }

  const matchLabels = new Map<string, string>();
  for (const doc of matchesSnap.docs) {
    const data = doc.data();
    matchLabels.set(doc.id, `${data.teamA} vs ${data.teamB}`);
  }

  return bonusSnap.docs.map((doc) => {
    const data = doc.data();
    const userId = data.userId as string;
    const matchId = data.matchId as string;
    const createdAt = data.createdAt?.toDate?.() ?? new Date();

    return {
      id: doc.id,
      userId,
      userName: userNames.get(userId) ?? userId,
      matchId,
      matchLabel: matchLabels.get(matchId) ?? matchId,
      points: data.points as number,
      reason: (data.reason as string | undefined) ?? null,
      createdAt: createdAt.toISOString(),
    };
  });
}

export async function awardBonusPoints(input: {
  userId: string;
  matchId: string;
  points: number;
  reason?: string;
}): Promise<BonusPointAward> {
  const { userId, matchId, points, reason } = input;

  if (!userId || !matchId) {
    throw new BonusPointError('userId and matchId are required', 'INVALID');
  }
  if (!Number.isInteger(points) || points === 0) {
    throw new BonusPointError('points must be a non-zero integer', 'INVALID');
  }

  const db = getAdminDb();
  const userRef = db.collection('users').doc(userId);
  const matchRef = db.collection('matches').doc(matchId);

  const [userSnap, matchSnap] = await Promise.all([userRef.get(), matchRef.get()]);
  if (!userSnap.exists) {
    throw new BonusPointError('User not found', 'USER_NOT_FOUND');
  }
  if (!matchSnap.exists) {
    throw new BonusPointError('Match not found', 'MATCH_NOT_FOUND');
  }

  const bonusRef = db.collection('bonusPoints').doc();
  const trimmedReason = reason?.trim() || null;

  await db.runTransaction(async (tx) => {
    tx.set(bonusRef, {
      userId,
      matchId,
      points,
      ...(trimmedReason ? { reason: trimmedReason } : {}),
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(userRef, { points: FieldValue.increment(points) });
  });

  const matchData = matchSnap.data()!;
  const bonusSnap = await bonusRef.get();
  const createdAt = bonusSnap.data()?.createdAt?.toDate?.() ?? new Date();

  return {
    id: bonusRef.id,
    userId,
    userName: (userSnap.data()?.name as string) ?? userId,
    matchId,
    matchLabel: `${matchData.teamA} vs ${matchData.teamB}`,
    points,
    reason: trimmedReason,
    createdAt: createdAt.toISOString(),
  };
}

export async function deleteBonusPoint(id: string): Promise<void> {
  if (!id) {
    throw new BonusPointError('id is required', 'INVALID');
  }

  const db = getAdminDb();
  const bonusRef = db.collection('bonusPoints').doc(id);

  await db.runTransaction(async (tx) => {
    const bonusSnap = await tx.get(bonusRef);
    if (!bonusSnap.exists) {
      throw new BonusPointError('Bonus point award not found', 'NOT_FOUND');
    }

    const data = bonusSnap.data()!;
    const userId = data.userId as string;
    const points = data.points as number;

    if (!userId || typeof points !== 'number') {
      throw new BonusPointError('Invalid bonus point record', 'INVALID');
    }

    const userRef = db.collection('users').doc(userId);
    tx.update(userRef, { points: FieldValue.increment(-points) });
    tx.delete(bonusRef);
  });
}
