'use client';

import type { User } from '@/lib/types';
import { accuracyPercent } from '@/lib/types';

interface LeaderboardProps {
  users: User[];
  currentUserId?: string;
}

export function Leaderboard({ users, currentUserId }: LeaderboardProps) {
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
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0
                        ? 'bg-gold-500 text-pitch-950'
                        : index === 1
                          ? 'bg-slate-300 text-slate-800'
                          : index === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {user.name}
                      {user.id === currentUserId && (
                        <span className="ml-1 text-xs font-normal text-gold-400">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-white/50">
                      {user.correctPredictions}/{user.totalPredictions} ({accuracy}%)
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-bold text-white">
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
