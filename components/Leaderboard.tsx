'use client';

import type { User } from '@/lib/types';
import { accuracyPercent, assignLeaderboardRanks } from '@/lib/types';
import { formatNationalityWithRank } from '@/lib/fifa-rankings';

interface LeaderboardProps {
  users: User[];
  currentUserId?: string;
}

function rankBadgeStyle(rank: number): string {
  if (rank === 1) return 'bg-gold-500 text-pitch-950';
  if (rank === 2) return 'bg-slate-300 text-slate-800';
  if (rank === 3) return 'bg-amber-700 text-white';
  return 'bg-white/10 text-white/70';
}

export function Leaderboard({ users, currentUserId }: LeaderboardProps) {
  const ranks = assignLeaderboardRanks(users);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md lg:sticky lg:top-6">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400">Leaderboard</p>
      <h2 className="mt-1 text-lg font-bold text-white">Rankings</h2>

      {users.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-white/50">
          No scores yet.
        </p>
      ) : (
        <ol className="mt-4 space-y-2">
          {users.map((user, index) => {
            const rank = ranks[index];
            const accuracy = accuracyPercent(user.correctPredictions, user.totalPredictions);
            return (
              <li
                key={user.id}
                className={`rounded-xl border px-3 py-3 ${
                  user.id === currentUserId
                    ? 'border-gold-400/50 bg-gold-400/10'
                    : 'border-white/10 bg-black/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${rankBadgeStyle(rank)}`}
                  >
                    {rank}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">
                      {user.name}
                      {user.id === currentUserId && (
                        <span className="ml-1 text-xs font-normal text-gold-400">(you)</span>
                      )}
                    </p>
                    {user.nationality && (
                      <p className="mt-0.5 break-words text-xs text-white/40">
                        {formatNationalityWithRank(user.nationality)}
                      </p>
                    )}
                    <p className="text-xs text-white/50">
                      {user.correctPredictions}/{user.totalPredictions} ({accuracy}%)
                    </p>
                  </div>

                  <span className="shrink-0 pt-0.5 text-sm font-bold text-white">
                    {user.points} <span className="text-xs font-normal text-white/40">pts</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
