'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaderboard } from '@/components/Leaderboard';
import { UpcomingMatchesSection } from '@/components/UpcomingMatchesSection';
import { ensureAnonymousAuth, logoutUser, rebindSession } from '@/lib/auth';
import { subscribeMatches } from '@/lib/matches';
import { clearStoredUserId, getStoredUserId } from '@/lib/session';
import { subscribeLeaderboard, subscribeUser } from '@/lib/users';
import type { Match, User } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getStoredUserId();
    if (!userId) {
      router.replace('/login');
      return;
    }

    ensureAnonymousAuth()
      .then(() => rebindSession(userId))
      .catch(() => {});

    const unsubUser = subscribeUser(userId, (u) => {
      if (!u) {
        clearStoredUserId();
        router.replace('/login');
        return;
      }
      setUser(u);
      setLoading(false);
    });

    const unsubBoard = subscribeLeaderboard(setLeaderboard);
    const unsubMatches = subscribeMatches(setMatches);

    return () => {
      unsubUser();
      unsubMatches();
      unsubBoard();
    };
  }, [router]);

  const handleLogout = async () => {
    const userId = getStoredUserId();
    if (userId) await logoutUser(userId).catch(() => {});
    clearStoredUserId();
    router.replace('/login');
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/70">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-500 text-xl">
            ⚽
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold-400">Family FIFA</p>
            <h1 className="text-xl font-bold">Hi, {user.name}</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:text-white"
        >
          Switch user
        </button>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(340px,380px)_minmax(0,1fr)]">
        <div className="order-2 lg:order-1">
          <Leaderboard users={leaderboard} currentUserId={user.id} />
        </div>

        <div className="order-1 lg:order-2">
          <UpcomingMatchesSection matches={matches} userId={user.id} />
        </div>
      </div>
    </div>
  );
}
