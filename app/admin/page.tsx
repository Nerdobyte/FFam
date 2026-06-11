'use client';

import { useEffect, useState } from 'react';
import { toUkDatetimeLocal, ukDatetimeLocalToIso } from '@/lib/datetime';
import type { Prediction } from '@/lib/types';

interface AdminMatch {
  id: string;
  teamA: string;
  teamB: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  scored: boolean;
  result: Prediction | null;
  totals: { teamA: number; teamB: number; draw: number };
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [secret, setSecret] = useState('');
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [matchId, setMatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [newMatch, setNewMatch] = useState({ teamA: '', teamB: '', startTime: '', endTime: '' });
  const [editKickoff, setEditKickoff] = useState('');

  const loadMatches = async () => {
    const res = await fetch('/api/admin/matches');
    if (!res.ok) {
      setAuthorized(false);
      throw new Error('Session expired');
    }
    const data = await res.json();
    setMatches(data.matches);

    const current = data.matches.find((m: AdminMatch) => !m.completed) ?? data.matches[0];
    if (current) {
      setMatchId(current.id);
      setEditKickoff(toUkDatetimeLocal(current.startTime));
    }

    return data.matches as AdminMatch[];
  };

  useEffect(() => {
    fetch('/api/admin/matches')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.matches) {
          setAuthorized(true);
          setMatches(data.matches);
          const current = data.matches.find((m: AdminMatch) => !m.completed) ?? data.matches[0];
          if (current) {
            setMatchId(current.id);
            setEditKickoff(toUkDatetimeLocal(current.startTime));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });
      if (!res.ok) {
        setMessage('Wrong admin secret');
        return;
      }
      setAuthorized(true);
      setSecret('');
      await loadMatches();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/matches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMatch,
          startTime: ukDatetimeLocalToIso(newMatch.startTime),
          endTime: newMatch.endTime ? ukDatetimeLocalToIso(newMatch.endTime) : '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessage(`Match created: ${data.teamA} vs ${data.teamB}`);
      setNewMatch({ teamA: '', teamB: '', startTime: '', endTime: '' });
      await loadMatches();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKickoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchId) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/matches/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, startTime: ukDatetimeLocalToIso(editKickoff) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessage('Kickoff time updated.');
      await loadMatches();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSetResult = async (result: Prediction) => {
    if (!matchId) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/set-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, winner: result }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessage(
        `Result set! ${data.pointsAwarded} point(s) awarded across ${data.voters} voter(s). Leaderboard updated.`,
      );
      await loadMatches();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRescore = async () => {
    if (!matchId) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/rescore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessage(
        `Scoring re-applied! ${data.pointsAwarded} of ${data.voters} voter(s) got points. Voters: ${(data.voterIds ?? []).join(', ') || 'none'}`,
      );
      await loadMatches();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthorized(false);
    setMatches([]);
  };

  const selected = matches.find((m) => m.id === matchId);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8"
        >
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="mt-2 text-sm text-white/60">Enter admin secret to continue.</p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-gold-400"
            placeholder="Admin secret"
          />
          {message && <p className="mt-3 text-sm text-red-300">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-gold-500 py-3 font-semibold text-pitch-950 disabled:opacity-60"
          >
            {loading ? 'Verifying...' : 'Unlock'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="mt-2 text-white/60">Manage matches and declare results.</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:text-white"
        >
          Log out
        </button>
      </div>

      {message && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      )}

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Create new match</h2>
        <form onSubmit={handleCreateMatch} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={newMatch.teamA}
              onChange={(e) => setNewMatch({ ...newMatch, teamA: e.target.value })}
              placeholder="Team A"
              required
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
            />
            <input
              value={newMatch.teamB}
              onChange={(e) => setNewMatch({ ...newMatch, teamB: e.target.value })}
              placeholder="Team B"
              required
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
            />
          </div>
          <label className="block text-sm text-white/70">
            Kickoff (UK time)
            <input
              type="datetime-local"
              value={newMatch.startTime}
              onChange={(e) => setNewMatch({ ...newMatch, startTime: e.target.value })}
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
            />
          </label>
          <label className="block text-sm text-white/70">
            End time (UK time, optional)
            <input
              type="datetime-local"
              value={newMatch.endTime}
              onChange={(e) => setNewMatch({ ...newMatch, endTime: e.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gold-500 py-3 font-semibold text-pitch-950 disabled:opacity-60"
          >
            Create match
          </button>
        </form>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Manage match</h2>

        <select
          value={matchId}
          onChange={(e) => {
            setMatchId(e.target.value);
            const m = matches.find((x) => x.id === e.target.value);
            if (m) setEditKickoff(toUkDatetimeLocal(m.startTime));
          }}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
        >
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.teamA} vs {m.teamB} ({m.completed ? 'completed' : 'active'})
            </option>
          ))}
        </select>

        {selected && (
          <>
            <div className="rounded-xl bg-black/20 p-4 text-sm text-white/70">
              <p className="font-semibold text-white">
                {selected.teamA} vs {selected.teamB}
              </p>
              <p className="mt-1 break-all font-mono text-xs text-white/40">ID: {selected.id}</p>
              <p className="mt-2">
                {selected.teamA}: {selected.totals.teamA} votes · Draw:{' '}
                {selected.totals.draw} votes · {selected.teamB}: {selected.totals.teamB} votes
              </p>
              <p className="mt-1">
                {selected.completed ? 'Completed' : 'Active'}
                {selected.scored ? ' · Marked scored' : ''}
              </p>
              {selected.scored &&
                selected.totals.teamA + selected.totals.teamB + selected.totals.draw > 0 && (
                  <p className="mt-2 text-amber-300">
                    Votes exist but leaderboard empty? Click &quot;Re-apply scoring&quot; below.
                  </p>
                )}
            </div>

            {!selected.completed && (
              <form onSubmit={handleUpdateKickoff} className="space-y-3">
                <label className="block text-sm text-white/70">
                  Edit kickoff time (UK time)
                  <input
                    type="datetime-local"
                    value={editKickoff}
                    onChange={(e) => setEditKickoff(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/20 py-3 font-semibold hover:bg-white/5 disabled:opacity-60"
                >
                  Save kickoff
                </button>
              </form>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                disabled={loading || selected.scored}
                onClick={() => handleSetResult('teamA')}
                className="rounded-xl bg-emerald-600 py-3 font-semibold transition hover:bg-emerald-500 disabled:opacity-50"
              >
                Set {selected.teamA} winner
              </button>
              <button
                type="button"
                disabled={loading || selected.scored}
                onClick={() => handleSetResult('draw')}
                className="rounded-xl bg-emerald-600 py-3 font-semibold transition hover:bg-emerald-500 disabled:opacity-50"
              >
                Set Draw
              </button>
              <button
                type="button"
                disabled={loading || selected.scored}
                onClick={() => handleSetResult('teamB')}
                className="rounded-xl bg-emerald-600 py-3 font-semibold transition hover:bg-emerald-500 disabled:opacity-50"
              >
                Set {selected.teamB} winner
              </button>
            </div>

            {selected.scored && (
              <button
                type="button"
                disabled={loading}
                onClick={handleRescore}
                className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 py-3 font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
              >
                Re-apply scoring (fix missing points)
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
