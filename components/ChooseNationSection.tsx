'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { formatNationalityWithRank } from '@/lib/fifa-rankings';

interface ChooseNationSectionProps {
  user: User;
}

interface LockStatus {
  locked: boolean;
  lockAtLabel: string | null;
  teams: string[];
}

export function ChooseNationSection({ user }: ChooseNationSectionProps) {
  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null);
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/nationality/lock-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setLockStatus({
            locked: data.locked,
            lockAtLabel: data.lockAtLabel ?? null,
            teams: data.teams ?? [],
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user.nationality) {
      setSelected(user.nationality);
    }
  }, [user.nationality]);

  if (user.nationality && lockStatus?.locked) {
    return null;
  }

  if (!lockStatus) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md">
        <p className="text-sm text-white/50">Loading nation selection…</p>
      </section>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const { auth } = await import('@/lib/firebase');
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/nationality', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id, nationality: selected }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setMessage(`Saved! You represent ${formatNationalityWithRank(data.nationality)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!user.nationality && lockStatus.locked) {
    return (
      <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-2xl backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-400">Choose your nation</p>
        <p className="mt-2 text-sm text-amber-200">Nationality selection is now locked.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400">Choose your nation</p>
      <h2 className="mt-1 text-lg font-bold text-white">Pick your World Cup team</h2>

      {user.nationality ? (
        <p className="mt-2 text-sm text-white/60">
          Current: <span className="text-white">{formatNationalityWithRank(user.nationality)}</span>
          {!lockStatus.locked && lockStatus.lockAtLabel && (
            <> — you can change until {lockStatus.lockAtLabel}.</>
          )}
        </p>
      ) : (
        <p className="mt-2 text-sm text-white/60">
          Select one nation to represent on the leaderboard.
        </p>
      )}

      <form onSubmit={handleSave} className="mt-4 space-y-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          required
          disabled={lockStatus.locked || saving}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white disabled:opacity-60"
        >
          <option value="">Select a nation…</option>
          {lockStatus.teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={lockStatus.locked || saving || !selected}
          className="w-full rounded-xl bg-gold-500 py-3 font-semibold text-pitch-950 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save nation'}
        </button>
      </form>

      {message && (
        <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
    </section>
  );
}
