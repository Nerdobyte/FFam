'use client';

import { useEffect, useState } from 'react';
import { TodayMatchCard } from '@/components/TodayMatchCard';
import { formatUkDate } from '@/lib/datetime';
import { getTodaysMatches, getTodaysVotableMatches } from '@/lib/matches';
import type { Match } from '@/lib/types';

interface TodaysMatchesSectionProps {
  matches: Match[];
  userId: string;
}

export function TodaysMatchesSection({ matches, userId }: TodaysMatchesSectionProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const todaysMatches = getTodaysMatches(matches, now);
  const votableCount = getTodaysVotableMatches(matches, now).length;

  const todayLabel = formatUkDate(now, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section className="space-y-6">
      <div className="text-center lg:text-left">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-400">Today&apos;s fixtures</p>
        <h2 className="mt-1 text-xl font-bold text-white">{todayLabel}</h2>
        {todaysMatches.length > 0 && (
          <p className="mt-2 text-sm text-white/60">
            {votableCount > 0
              ? `${votableCount} match${votableCount !== 1 ? 'es' : ''} open for voting`
              : 'All of today\u2019s matches have kicked off — voting closed'}
          </p>
        )}
      </div>

      {todaysMatches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-6 py-12 text-center">
          <p className="text-4xl">📅</p>
          <p className="mt-3 text-lg font-semibold text-white">No matches today</p>
          <p className="mt-1 text-sm text-white/50">Check back when the next fixtures are scheduled.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {todaysMatches.map((match) => (
            <TodayMatchCard
              key={match.id}
              match={match}
              userId={userId}
              compactHeader={todaysMatches.length > 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}
