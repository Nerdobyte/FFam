'use client';

import type { Match, VoteTotals } from '@/lib/types';
import { votePercentages } from '@/lib/types';

interface CommunityVotesProps {
  match: Match;
  totals: VoteTotals | null;
  hasVoted: boolean;
  loading?: boolean;
  drawEnabled?: boolean;
}

export function CommunityVotes({
  match,
  totals,
  hasVoted,
  loading,
  drawEnabled = true,
}: CommunityVotesProps) {
  if (!hasVoted) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md lg:sticky lg:top-6">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-400">Community</p>
        <h2 className="mt-1 text-lg font-bold text-white">Family picks</h2>
        <p className="mt-4 rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/50">
          Cast your vote to see how the family is picking.
        </p>
      </section>
    );
  }

  if (loading || !totals) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md lg:sticky lg:top-6">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-400">Community</p>
        <h2 className="mt-1 text-lg font-bold text-white">Family picks</h2>
        <p className="mt-4 text-center text-sm text-white/50">Loading results…</p>
      </section>
    );
  }

  const total = totals.teamA + totals.teamB + totals.draw;
  const pct = votePercentages(totals);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md lg:sticky lg:top-6">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400">Community</p>
      <h2 className="mt-1 text-lg font-bold text-white">Family picks</h2>

      <div className="mt-5 space-y-5">
        <PercentBar label={match.teamA} percent={pct.teamA} count={totals.teamA} />
        {drawEnabled && (
          <PercentBar label="Draw" percent={pct.draw} count={totals.draw} />
        )}
        <PercentBar label={match.teamB} percent={pct.teamB} count={totals.teamB} />
      </div>

      <p className="mt-5 text-center text-xs text-white/50">
        {total} vote{total !== 1 ? 's' : ''} cast
      </p>
    </section>
  );
}

function PercentBar({
  label,
  percent,
  count,
}: {
  label: string;
  percent: number;
  count: number;
}) {
  const barWidth = Math.min(100, Math.max(0, percent));

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="truncate text-sm font-semibold text-white">{label}</span>
        <span className="shrink-0 text-sm font-bold text-gold-400">{barWidth}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full bg-gold-500 transition-all duration-500"
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-white/40">
        {count} vote{count !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
