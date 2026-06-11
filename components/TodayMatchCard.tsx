'use client';

import { useCallback, useEffect, useState } from 'react';
import { CommunityVotes } from '@/components/CommunityVotes';
import { MatchCard } from '@/components/MatchCard';
import { MyPick } from '@/components/MyPick';
import { formatKickoffTime, isVotingOpen } from '@/lib/matches';
import {
  fetchCommunityTotals,
  submitVote,
  subscribeUserPrediction,
} from '@/lib/votes';
import type { Match, Prediction, VoteTotals } from '@/lib/types';

interface TodayMatchCardProps {
  match: Match;
  userId: string;
  compactHeader?: boolean;
}

export function TodayMatchCard({ match, userId, compactHeader }: TodayMatchCardProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [totals, setTotals] = useState<VoteTotals | null>(null);
  const [totalsLoading, setTotalsLoading] = useState(false);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [votingOpen, setVotingOpen] = useState(isVotingOpen(match));

  const loadTotals = useCallback(async () => {
    setTotalsLoading(true);
    const result = await fetchCommunityTotals(match.id, userId);
    setTotals(result);
    setTotalsLoading(false);
  }, [match.id, userId]);

  useEffect(() => {
    const unsub = subscribeUserPrediction(match.id, userId, setPrediction);
    return unsub;
  }, [match.id, userId]);

  useEffect(() => {
    if (!prediction) {
      setTotals(null);
      return;
    }
    loadTotals();
    const interval = setInterval(loadTotals, 15000);
    return () => clearInterval(interval);
  }, [prediction, loadTotals]);

  useEffect(() => {
    const tick = () => setVotingOpen(isVotingOpen(match, new Date()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [match.id, match.startTime.getTime(), match.completed]);

  const handleVote = async (pick: Prediction) => {
    if (!votingOpen) return;
    setVoteError('');
    setVoting(true);
    try {
      await submitVote(match.id, userId, pick);
      await loadTotals();
    } catch (err) {
      setVoteError(err instanceof Error ? err.message : 'Vote failed');
    } finally {
      setVoting(false);
    }
  };

  return (
    <article className="space-y-4 rounded-3xl border border-white/10 bg-black/10 p-4">
      {compactHeader && (
        <p className="text-center text-sm font-medium text-gold-400 lg:text-left">
          Kickoff {formatKickoffTime(match)}
        </p>
      )}

      <MatchCard
        match={match}
        userPrediction={prediction}
        voting={voting}
        onVote={handleVote}
        votingEnabled={votingOpen}
        compactKickoff={compactHeader}
      />

      {voteError && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
          {voteError}
        </p>
      )}

      {votingOpen && <MyPick match={match} prediction={prediction} />}

      {!votingOpen && prediction && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/70">
          You picked{' '}
          <strong className="text-white">
            {prediction === 'teamA' ? match.teamA : match.teamB}
          </strong>{' '}
          — voting closed at kickoff
        </div>
      )}

      <CommunityVotes
        match={match}
        totals={totals}
        hasVoted={prediction !== null}
        loading={totalsLoading}
      />
    </article>
  );
}
