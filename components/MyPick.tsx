'use client';

import type { Match, Prediction } from '@/lib/types';

interface MyPickProps {
  match: Match;
  prediction: Prediction | null;
}

export function MyPick({ match, prediction }: MyPickProps) {
  const teamName = prediction
    ? prediction === 'teamA'
      ? match.teamA
      : match.teamB
    : null;

  if (!teamName) {
    return (
      <section className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center backdrop-blur-md">
        <p className="text-sm text-white/50">Pick a team before kickoff to lock in your vote.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gold-400/40 bg-gold-400/10 p-6 text-center shadow-lg shadow-gold-400/10 backdrop-blur-md">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-400">You picked</p>
      <p className="mt-2 text-3xl font-extrabold text-white md:text-4xl">{teamName}</p>
      <p className="mt-2 text-sm text-emerald-300">Your vote is saved — change it anytime before kickoff.</p>
    </section>
  );
}
