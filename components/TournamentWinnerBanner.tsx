'use client';

import { useEffect, useState } from 'react';

export function TournamentWinnerBanner() {
  const [winnerName, setWinnerName] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tournament-winner')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (typeof data?.winnerName === 'string' && data.winnerName.trim()) {
          setWinnerName(data.winnerName.trim());
        }
      })
      .catch(() => {});
  }, []);

  if (!winnerName) return null;

  return (
    <div className="mb-6 rounded-3xl border border-gold-400/40 bg-gradient-to-r from-gold-500/20 via-gold-400/10 to-emerald-500/10 px-5 py-5 text-center shadow-2xl backdrop-blur-md">
      <p className="text-xs uppercase tracking-[0.35em] text-gold-400">Family Tournament</p>
      <p className="mt-2 text-sm text-white/70">Winner</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">{winnerName}</p>
    </div>
  );
}
