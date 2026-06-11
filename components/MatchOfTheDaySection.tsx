'use client';

import { CommunityVotes } from '@/components/CommunityVotes';
import { MatchCard } from '@/components/MatchCard';
import { MyPick } from '@/components/MyPick';
import type { MatchOfTheDayMode } from '@/lib/matches';
import type { Match, Prediction, VoteTotals } from '@/lib/types';

interface MatchOfTheDaySectionProps {
  match: Match | null;
  mode: MatchOfTheDayMode;
  prediction: Prediction | null;
  totals: VoteTotals | null;
  totalsLoading: boolean;
  voting: boolean;
  voteError: string;
  onVote: (pick: Prediction) => void;
}

export function MatchOfTheDaySection({
  match,
  mode,
  prediction,
  totals,
  totalsLoading,
  voting,
  voteError,
  onVote,
}: MatchOfTheDaySectionProps) {
  return (
    <section className="space-y-4">
      <div className="text-center lg:text-left">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-400">Match of the Day</p>
        {mode === 'none' && (
          <p className="mt-2 text-sm text-white/60">No active match right now</p>
        )}
        {mode === 'completed' && (
          <p className="mt-2 text-sm text-white/60">
            No active match right now — showing latest result
          </p>
        )}
      </div>

      {match ? (
        <>
          <MatchCard
            match={match}
            userPrediction={prediction}
            voting={voting}
            onVote={onVote}
            votingEnabled={mode === 'upcoming'}
          />
          {voteError && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
              {voteError}
            </p>
          )}
          {mode === 'upcoming' && <MyPick match={match} prediction={prediction} />}
          {mode !== 'upcoming' && match.completed && match.result && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center text-sm text-white/70">
              Final:{' '}
              <strong className="text-white">
                {match.result === 'teamA' ? match.teamA : match.teamB}
              </strong>{' '}
              won
            </div>
          )}
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-6 py-12 text-center">
          <p className="text-4xl">📅</p>
          <p className="mt-3 text-lg font-semibold text-white">No matches scheduled yet</p>
          <p className="mt-1 text-sm text-white/50">Ask the admin to add the next fixture.</p>
        </div>
      )}

      {match && mode === 'upcoming' && (
        <div className="lg:hidden">
          <CommunityVotes
            match={match}
            totals={totals}
            hasVoted={prediction !== null}
            loading={totalsLoading}
          />
        </div>
      )}
    </section>
  );
}
