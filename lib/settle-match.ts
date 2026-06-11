import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { getAdminDb } from './firebase-admin';
import type { Prediction } from './types';

export class SettleMatchError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'ALREADY_SCORED' | 'NO_RESULT' | 'NOT_READY' | 'NO_VOTES',
  ) {
    super(message);
    this.name = 'SettleMatchError';
  }
}

export interface SettleMatchResult {
  matchId: string;
  result: Prediction;
  pointsAwarded: number;
  voters: number;
  teamA: string;
  teamB: string;
  voterIds: string[];
}

function readPrediction(data: Record<string, unknown>): Prediction | null {
  const value = data.prediction ?? data.choice;
  if (value === 'teamA' || value === 'teamB') return value;
  return null;
}

/** Fetch votes by matchId field, with fallback to vote doc ID prefix `{matchId}_`. */
export async function getVotesForMatch(db: Firestore, matchId: string) {
  const byField = await db.collection('votes').where('matchId', '==', matchId).get();
  if (!byField.empty) return byField.docs;

  const allVotes = await db.collection('votes').get();
  const prefix = `${matchId}_`;
  return allVotes.docs.filter(
    (doc) => doc.id.startsWith(prefix) || doc.data().matchId === matchId,
  );
}

/**
 * Awards points for a match. Idempotent — guarded by match.scored inside a transaction.
 */
export async function settleMatch(
  matchId: string,
  winner?: Prediction,
): Promise<SettleMatchResult> {
  const db = getAdminDb();
  const matchRef = db.collection('matches').doc(matchId);

  const voteDocs = await getVotesForMatch(db, matchId);

  if (voteDocs.length === 0) {
    throw new SettleMatchError(
      `No votes found for match "${matchId}". Check that users voted on this exact match ID in the votes collection.`,
      'NO_VOTES',
    );
  }

  return db.runTransaction(async (tx) => {
    const matchSnap = await tx.get(matchRef);
    if (!matchSnap.exists) {
      throw new SettleMatchError('Match not found', 'NOT_FOUND');
    }

    const match = matchSnap.data()!;

    if (match.scored === true) {
      throw new SettleMatchError('Points already awarded for this match', 'ALREADY_SCORED');
    }

    const result: Prediction | null = winner ?? match.result ?? null;
    if (!result || (result !== 'teamA' && result !== 'teamB')) {
      throw new SettleMatchError('Match has no result to score against', 'NO_RESULT');
    }

    if (!winner && !match.completed) {
      throw new SettleMatchError('Match is not completed yet', 'NOT_READY');
    }

    let pointsAwarded = 0;
    const voterIds: string[] = [];

    voteDocs.forEach((voteDoc) => {
      const data = voteDoc.data();
      const userId = data.userId as string;
      const prediction = readPrediction(data);

      if (!userId || !prediction) return;

      voterIds.push(userId);
      const isCorrect = prediction === result;
      if (isCorrect) pointsAwarded += 1;

      const userRef = db.collection('users').doc(userId);
      const userUpdates: Record<string, ReturnType<typeof FieldValue.increment>> = {
        totalPredictions: FieldValue.increment(1),
      };

      if (isCorrect) {
        userUpdates.correctPredictions = FieldValue.increment(1);
        userUpdates.points = FieldValue.increment(1);
      }

      tx.set(userRef, userUpdates, { merge: true });
    });

    tx.update(matchRef, {
      result,
      completed: true,
      scored: true,
    });

    return {
      matchId,
      result,
      pointsAwarded,
      voters: voterIds.length,
      teamA: match.teamA as string,
      teamB: match.teamB as string,
      voterIds,
    };
  });
}

/**
 * Re-run scoring for a match already marked scored (e.g. manual console edit or 0-vote settle).
 * Resets scored=false then settles using the existing result.
 */
export async function repairSettleMatch(matchId: string): Promise<SettleMatchResult> {
  const db = getAdminDb();
  const matchRef = db.collection('matches').doc(matchId);
  const matchSnap = await matchRef.get();

  if (!matchSnap.exists) {
    throw new SettleMatchError('Match not found', 'NOT_FOUND');
  }

  const match = matchSnap.data()!;
  if (!match.result || (match.result !== 'teamA' && match.result !== 'teamB')) {
    throw new SettleMatchError('Match has no result to score against', 'NO_RESULT');
  }

  await matchRef.update({ scored: false });
  return settleMatch(matchId);
}
