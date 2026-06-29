'use client';

import { useEffect, useState } from 'react';
import type { Match, MatchStatus, Prediction } from '@/lib/types';
import { MATCH_STATUS_LABELS, formatMatchResult, getMatchStatus } from '@/lib/types';
import { formatUkDateTime, formatUkTime } from '@/lib/datetime';
import { getCountdown, isVotingOpen } from '@/lib/matches';

interface MatchCardProps {
  match: Match;
  userPrediction: Prediction | null;
  voting: boolean;
  onVote: (prediction: Prediction) => void;
  votingEnabled?: boolean;
  compactKickoff?: boolean;
  drawEnabled?: boolean;
}

const STATUS_STYLES: Record<MatchStatus, string> = {
  'voting-open': 'bg-emerald-500/20 text-emerald-300',
  'voting-closed': 'bg-amber-500/20 text-amber-300',
  'result-declared': 'bg-gold-500/20 text-gold-400',
};

export function MatchCard({
  match,
  userPrediction,
  voting,
  onVote,
  votingEnabled = true,
  compactKickoff = false,
  drawEnabled = true,
}: MatchCardProps) {
  const [now, setNow] = useState(new Date());
  const votingOpen = votingEnabled && isVotingOpen(match, now);
  const status = getMatchStatus(match, now);
  const countdown = getCountdown(match, now);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const kickoff = compactKickoff
    ? formatUkTime(match.startTime)
    : formatUkDateTime(match.startTime);

  const resultLabel = formatMatchResult(match);
  const resultHeading = match.result === 'draw' ? 'Result' : 'Winner';

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
      <div className="border-b border-white/10 bg-black/20 px-6 py-4 text-center">
        <h2 className="text-2xl font-bold text-white md:text-3xl">
          {match.teamA} vs {match.teamB}
        </h2>
        <p className="mt-2 text-sm text-white/60">{kickoff}</p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[status]}`}
          >
            {MATCH_STATUS_LABELS[status]}
          </span>
          {status === 'voting-open' && (
            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-medium text-white/70">
              {countdown}
            </span>
          )}
        </div>
      </div>

      <div
        className={`grid gap-4 px-6 py-8 md:items-center ${
          drawEnabled ? 'md:grid-cols-3' : 'md:grid-cols-[1fr_auto_1fr]'
        }`}
      >
        <VoteButton
          team={match.teamA}
          selected={userPrediction === 'teamA'}
          disabled={!votingOpen || voting}
          onClick={() => onVote('teamA')}
        />

        {drawEnabled ? (
          <DrawButton
            selected={userPrediction === 'draw'}
            disabled={!votingOpen || voting}
            onClick={() => onVote('draw')}
          />
        ) : (
          <div className="hidden text-center md:block">
            <p className="text-4xl font-black text-white/30">VS</p>
          </div>
        )}

        <VoteButton
          team={match.teamB}
          selected={userPrediction === 'teamB'}
          disabled={!votingOpen || voting}
          onClick={() => onVote('teamB')}
        />
      </div>

      {status === 'voting-open' && (
        <p className="border-t border-white/10 px-6 py-3 text-center font-mono text-sm font-medium text-gold-400">
          {countdown}
        </p>
      )}

      {status === 'result-declared' && match.result && (
        <div className="border-t border-white/10 bg-gold-500/10 px-6 py-4 text-center text-sm text-gold-400">
          {resultHeading}: <strong>{resultLabel}</strong>
        </div>
      )}
    </section>
  );
}

function VoteButton({
  team,
  selected,
  disabled,
  onClick,
}: {
  team: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl border p-6 text-center transition ${
        selected
          ? 'border-gold-400 bg-gold-400/10 shadow-lg shadow-gold-400/10'
          : 'border-white/10 bg-black/20 hover:border-white/30 hover:bg-black/30'
      } ${disabled && !selected ? 'cursor-not-allowed opacity-70' : ''}`}
    >
      <p className="text-xl font-bold text-white md:text-2xl">{team}</p>
      {!disabled && (
        <p className="mt-3 text-sm font-medium text-gold-400">
          {selected ? 'Tap to change' : 'Pick to win'}
        </p>
      )}
      {disabled && selected && (
        <p className="mt-3 text-sm font-semibold text-gold-400">Your pick</p>
      )}
    </button>
  );
}

function DrawButton({
  selected,
  disabled,
  onClick,
}: {
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl border p-6 text-center transition ${
        selected
          ? 'border-gold-400 bg-gold-400/10 shadow-lg shadow-gold-400/10'
          : 'border-white/10 bg-black/20 hover:border-white/30 hover:bg-black/30'
      } ${disabled && !selected ? 'cursor-not-allowed opacity-70' : ''}`}
    >
      <p className="text-xl font-bold text-white md:text-2xl">Draw</p>
      {!disabled && (
        <p className="mt-3 text-sm font-medium text-gold-400">
          {selected ? 'Tap to change' : 'Pick a draw'}
        </p>
      )}
      {disabled && selected && (
        <p className="mt-3 text-sm font-semibold text-gold-400">Your pick</p>
      )}
    </button>
  );
}
