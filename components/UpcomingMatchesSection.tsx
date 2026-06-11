'use client';

import { useEffect, useState } from 'react';
import { TodayMatchCard } from '@/components/TodayMatchCard';
import { getUpcomingMatches, getVotableUpcomingMatches } from '@/lib/matches';
import type { Match } from '@/lib/types';

interface UpcomingMatchesSectionProps {
  matches: Match[];
  userId: string;
}

export function UpcomingMatchesSection({ matches, userId }: UpcomingMatchesSectionProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const upcomingMatches = getUpcomingMatches(matches, now);
  const votableCount = getVotableUpcomingMatches(matches, now).length;

  return (
    <section className="space-y-6">
      <div className="text-center lg:text-left">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-400">Upcoming matches</p>
        <h2 className="mt-1 text-xl font-bold text-white">Next 24 hours</h2>
        {upcomingMatches.length > 0 && (
          <p className="mt-2 text-sm text-white/60">
            {votableCount > 0
              ? `${votableCount} match${votableCount !== 1 ? 'es' : ''} open for voting`
              : 'All upcoming matches have kicked off — voting closed'}
          </p>
        )}
      </div>

      {upcomingMatches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-6 py-12 text-center">
          <p className="text-4xl">📅</p>
          <p className="mt-3 text-lg font-semibold text-white">No matches in the next 24 hours</p>
          <p className="mt-1 text-sm text-white/50">
            New fixtures appear here automatically as they enter the voting window.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcomingMatches.map((match) => (
            <TodayMatchCard
              key={match.id}
              match={match}
              userId={userId}
              compactHeader={upcomingMatches.length > 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}
