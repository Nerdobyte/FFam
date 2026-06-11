import {
  Timestamp,
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { formatUkTime, isSameUkCalendarDay } from './datetime';
import { db } from './firebase';
import type { Match } from './types';

interface MatchDoc {
  teamA: string;
  teamB: string;
  startTime: Timestamp;
  endTime: Timestamp;
  result: 'teamA' | 'teamB' | null;
  completed: boolean;
}

export type MatchOfTheDayMode = 'upcoming' | 'completed' | 'none';

export interface MatchOfTheDayState {
  match: Match | null;
  mode: MatchOfTheDayMode;
}

function toMatch(id: string, data: MatchDoc): Match {
  return {
    id,
    teamA: data.teamA,
    teamB: data.teamB,
    startTime: data.startTime.toDate(),
    endTime: data.endTime.toDate(),
    result: data.result ?? null,
    completed: data.completed ?? false,
  };
}

export function sortMatchesByStartTime(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return isSameUkCalendarDay(a, b);
}

/** Non-completed matches kicking off today (UK time), soonest first. */
export function getTodaysMatches(matches: Match[], now = new Date()): Match[] {
  return sortMatchesByStartTime(
    matches.filter((m) => !m.completed && isSameCalendarDay(m.startTime, now)),
  );
}

/** Matches on today's calendar where voting is still open. */
export function getTodaysVotableMatches(matches: Match[], now = new Date()): Match[] {
  return getTodaysMatches(matches, now).filter((m) => isVotingOpen(m, now));
}

export function getUpcomingMatch(matches: Match[], now = new Date()): Match | null {
  const sorted = sortMatchesByStartTime(matches);
  return sorted.find((m) => !m.completed && m.startTime > now) ?? null;
}

export function getLatestCompletedMatch(matches: Match[]): Match | null {
  const sorted = sortMatchesByStartTime(matches);
  const completed = sorted.filter((m) => m.completed);
  return completed.length > 0 ? completed[completed.length - 1] : null;
}

export function getMatchOfTheDay(matches: Match[], now = new Date()): MatchOfTheDayState {
  const todays = getTodaysVotableMatches(matches, now);
  if (todays.length > 0) return { match: todays[0], mode: 'upcoming' };

  const latest = getLatestCompletedMatch(matches);
  if (latest) return { match: latest, mode: 'completed' };

  return { match: null, mode: 'none' };
}

export function isVotingOpen(match: Match, now = new Date()): boolean {
  return now < match.startTime && !match.completed;
}

export function getCountdown(match: Match, now = new Date()): string {
  const diff = match.startTime.getTime() - now.getTime();
  if (diff <= 0) return 'Kickoff — voting closed';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s to kickoff`;
  if (minutes > 0) return `${minutes}m ${seconds}s to kickoff`;
  return `${seconds}s to kickoff`;
}

export function formatKickoffTime(match: Match): string {
  return formatUkTime(match.startTime);
}

export function subscribeMatches(onMatches: (matches: Match[]) => void) {
  const q = query(collection(db, 'matches'), orderBy('startTime', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const matches = snapshot.docs.map((d) => toMatch(d.id, d.data() as MatchDoc));
    onMatches(matches);
  });
}

/** @deprecated Use subscribeMatches */
export function subscribeMatchOfTheDay(onState: (state: MatchOfTheDayState) => void) {
  return subscribeMatches((matches) => onState(getMatchOfTheDay(matches)));
}

/** @deprecated Use getMatchOfTheDay */
export function pickCurrentMatch(matches: Match[], now = new Date()): Match | null {
  return getMatchOfTheDay(matches, now).match;
}

/** @deprecated Use subscribeMatches */
export function subscribeCurrentMatch(onMatch: (match: Match | null) => void) {
  return subscribeMatchOfTheDay((state) => onMatch(state.match));
}
