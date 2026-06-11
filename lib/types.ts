export function accuracyPercent(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export interface User {
  id: string;
  name: string;
  code: string;
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

export type Prediction = 'teamA' | 'teamB';

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

export function getMatchStatus(match: Match, now = new Date()): MatchStatus {
  if (match.completed && match.result) return 'result-declared';
  if (now >= match.startTime) return 'voting-closed';
  return 'voting-open';
}

export function votePercentages(totals: VoteTotals): { teamA: number; teamB: number } {
  const total = totals.teamA + totals.teamB;
  if (total === 0) return { teamA: 50, teamB: 50 };
  const teamA = Math.round((totals.teamA / total) * 100);
  return { teamA, teamB: 100 - teamA };
}

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  'voting-open': 'Open for voting',
  'voting-closed': 'Voting closed',
  'result-declared': 'Result declared',
};
