import { getBonusPointsByUser } from './bonus-points';
import { getAdminDb } from './firebase-admin';
import type { Prediction } from './types';
import { scorePoints } from './types';

export interface UserLeaderboardStats {
  points: number;
  correctPredictions: number;
  totalPredictions: number;
}

export interface LeaderboardAuditEntry {
  userId: string;
  name: string;
  stored: UserLeaderboardStats;
  expected: UserLeaderboardStats;
  matches: boolean;
}

export interface LeaderboardAuditResult {
  entries: LeaderboardAuditEntry[];
  mismatches: LeaderboardAuditEntry[];
  allMatch: boolean;
  scoredMatchCount: number;
  voteCountOnScoredMatches: number;
}

function readPrediction(data: Record<string, unknown>): Prediction | null {
  const value = data.prediction ?? data.choice;
  if (value === 'teamA' || value === 'teamB' || value === 'draw') return value;
  return null;
}

function emptyStats(): UserLeaderboardStats {
  return { points: 0, correctPredictions: 0, totalPredictions: 0 };
}

function statsMatch(a: UserLeaderboardStats, b: UserLeaderboardStats): boolean {
  return (
    a.points === b.points &&
    a.correctPredictions === b.correctPredictions &&
    a.totalPredictions === b.totalPredictions
  );
}

/** Recompute each user's stats from votes on scored matches plus bonus points. */
export async function auditLeaderboard(): Promise<LeaderboardAuditResult> {
  const db = getAdminDb();

  const [matchesSnap, votesSnap, usersSnap, bonusByUser] = await Promise.all([
    db.collection('matches').get(),
    db.collection('votes').get(),
    db.collection('users').get(),
    getBonusPointsByUser(),
  ]);

  const scoredResults = new Map<string, Prediction>();
  for (const doc of matchesSnap.docs) {
    const data = doc.data();
    if (data.scored !== true || !data.result) continue;
    const result = data.result as Prediction;
    if (result === 'teamA' || result === 'teamB' || result === 'draw') {
      scoredResults.set(doc.id, result);
    }
  }

  const expectedByUser = new Map<string, UserLeaderboardStats>();
  let voteCountOnScoredMatches = 0;

  for (const voteDoc of votesSnap.docs) {
    const data = voteDoc.data();
    const userId = data.userId as string | undefined;
    const matchId = data.matchId as string | undefined;
    if (!userId || !matchId) continue;

    const result = scoredResults.get(matchId);
    if (!result) continue;

    const prediction = readPrediction(data);
    if (!prediction) continue;

    voteCountOnScoredMatches += 1;
    const stats = expectedByUser.get(userId) ?? emptyStats();
    stats.totalPredictions += 1;
    const points = scorePoints(prediction, result);
    if (points > 0) {
      stats.correctPredictions += 1;
      stats.points += points;
    }
    expectedByUser.set(userId, stats);
  }

  const entries: LeaderboardAuditEntry[] = usersSnap.docs.map((doc) => {
    const data = doc.data();
    const stored: UserLeaderboardStats = {
      points: (data.points as number) ?? 0,
      correctPredictions: (data.correctPredictions as number) ?? 0,
      totalPredictions: (data.totalPredictions as number) ?? 0,
    };
    const predictionStats = expectedByUser.get(doc.id) ?? emptyStats();
    const bonusTotal = bonusByUser.get(doc.id) ?? 0;
    const expected: UserLeaderboardStats = {
      ...predictionStats,
      points: predictionStats.points + bonusTotal,
    };
    return {
      userId: doc.id,
      name: (data.name as string) ?? doc.id,
      stored,
      expected,
      matches: statsMatch(stored, expected),
    };
  });

  entries.sort((a, b) => a.name.localeCompare(b.name));
  const mismatches = entries.filter((e) => !e.matches);

  return {
    entries,
    mismatches,
    allMatch: mismatches.length === 0,
    scoredMatchCount: scoredResults.size,
    voteCountOnScoredMatches,
  };
}

/** Recalculate and overwrite user stats when they differ from vote history. */
export async function reconcileLeaderboard(): Promise<
  LeaderboardAuditResult & { repairedCount: number; repairedUserIds: string[] }
> {
  const audit = await auditLeaderboard();
  const db = getAdminDb();
  const repairedUserIds: string[] = [];

  for (const entry of audit.mismatches) {
    await db.collection('users').doc(entry.userId).update({
      points: entry.expected.points,
      correctPredictions: entry.expected.correctPredictions,
      totalPredictions: entry.expected.totalPredictions,
    });
    repairedUserIds.push(entry.userId);
  }

  const refreshed = await auditLeaderboard();

  return {
    ...refreshed,
    repairedCount: repairedUserIds.length,
    repairedUserIds,
  };
}
