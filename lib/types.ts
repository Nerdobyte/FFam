export function accuracyPercent(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export interface User {
  id: string;
  name: string;
  code: string;
  nationality: string | null;
  points: number;
  correctPredictions: number;
  totalPredictions: number;
}

export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  startTime: Date;
  endTime: Date;
  result: Prediction | null;
  completed: boolean;
}

export type Prediction = 'teamA' | 'teamB' | 'draw';

export type MatchStatus = 'voting-open' | 'voting-closed' | 'result-declared';

export interface Vote {
  id: string;
  matchId: string;
  userId: string;
  prediction: Prediction;
  createdAt: Date;
}

export interface VoteTotals {
  teamA: number;
  teamB: number;
  draw: number;
}

export function scorePoints(prediction: Prediction, result: Prediction): number {
  if (prediction === result) return 3;
  return 0;
}

export function formatPrediction(match: Match, prediction: Prediction): string {
  if (prediction === 'draw') return 'Draw';
  return prediction === 'teamA' ? match.teamA : match.teamB;
}

export function formatMatchResult(match: Match): string {
  if (!match.result) return '';
  if (match.result === 'draw') return 'Draw';
  return match.result === 'teamA' ? match.teamA : match.teamB;
}

export function sortLeaderboard(users: User[]): User[] {
  return [...users].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;

    const accA = accuracyPercent(a.correctPredictions, a.totalPredictions);
    const accB = accuracyPercent(b.correctPredictions, b.totalPredictions);
    if (accB !== accA) return accB - accA;

    if (b.correctPredictions !== a.correctPredictions) {
      return b.correctPredictions - a.correctPredictions;
    }

    return a.name.localeCompare(b.name);
  });
}

/** Dense ranks by points — tied scores share a position; next tier increments by 1 (e.g. 1, 2, 2, 3). */
export function assignLeaderboardRanks(users: User[]): number[] {
  if (users.length === 0) return [];

  const ranks = [1];
  let rank = 1;
  for (let i = 1; i < users.length; i++) {
    if (users[i].points !== users[i - 1].points) {
      rank += 1;
    }
    ranks.push(rank);
  }
  return ranks;
}

export function getMatchStatus(match: Match, now = new Date()): MatchStatus {
  if (match.completed && match.result) return 'result-declared';
  if (now >= match.startTime) return 'voting-closed';
  return 'voting-open';
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function votePercentages(
  totals: VoteTotals,
): { teamA: number; teamB: number; draw: number } {
  const total = totals.teamA + totals.teamB + totals.draw;
  if (total === 0) return { teamA: 0, teamB: 0, draw: 0 };

  return {
    teamA: clampPercent(Math.round((totals.teamA / total) * 100)),
    teamB: clampPercent(Math.round((totals.teamB / total) * 100)),
    draw: clampPercent(Math.round((totals.draw / total) * 100)),
  };
}

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  'voting-open': 'Open for voting',
  'voting-closed': 'Voting closed',
  'result-declared': 'Result declared',
};
