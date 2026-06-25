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

interface LeaderboardAuditEntry {
  userId: string;
  name: string;
  stored: { points: number; correctPredictions: number; totalPredictions: number };
  expected: { points: number; correctPredictions: number; totalPredictions: number };
  matches: boolean;
}

interface LeaderboardAuditReport {
  allMatch: boolean;
  scoredMatchCount: number;
  voteCountOnScoredMatches: number;
  mismatches: LeaderboardAuditEntry[];
  entries: LeaderboardAuditEntry[];
  repairedCount?: number;
  repairedUserIds?: string[];
}

interface NationalityLockState {
  lockAtLabel: string | null;
  locked: boolean;
  status: 'Active' | 'Locked';
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
  const [auditReport, setAuditReport] = useState<LeaderboardAuditReport | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [nationalityLock, setNationalityLock] = useState<NationalityLockState | null>(null);
  const [editNationalityLock, setEditNationalityLock] = useState('');

  const loadNationalityLock = async () => {
    const res = await fetch('/api/admin/nationality-lock');
    if (!res.ok) return null;
    const data = await res.json();
    setNationalityLock({
      lockAtLabel: data.lockAtLabel ?? null,
      locked: data.locked,
      status: data.status,
    });
    if (data.lockAt) {
      setEditNationalityLock(toUkDatetimeLocal(data.lockAt));
    }
    return data;
  };

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
          loadNationalityLock().catch(() => {});
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
      await loadNationalityLock();
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

  const handleLeaderboardAudit = async () => {
    setAuditLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/leaderboard-audit', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');
      setAuditReport(data);
      if (data.allMatch) {
        setMessage(
          `Leaderboard check passed — all ${data.entries.length} player(s) match their votes across ${data.scoredMatchCount} scored match(es).`,
        );
      } else {
        setMessage(
          `Leaderboard mismatch — ${data.mismatches.length} player(s) have incorrect stats. Review below and click "Fix leaderboard" to update.`,
        );
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleNationalityLockSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNationalityLock) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/nationality-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockAt: ukDatetimeLocalToIso(editNationalityLock) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessage(`Nationality lock updated — ${data.status} (deadline: ${data.lockAtLabel}).`);
      await loadNationalityLock();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaderboardReconcile = async () => {
    setAuditLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/leaderboard-reconcile', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reconcile failed');
      setAuditReport(data);
      if (data.repairedCount === 0) {
        setMessage('Leaderboard already correct — no updates needed.');
      } else {
        setMessage(
          `Leaderboard updated for ${data.repairedCount} player(s): ${(data.repairedUserIds ?? []).join(', ')}.`,
        );
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Reconcile failed');
    } finally {
      setAuditLoading(false);
    }
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

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Nationality lock</h2>
        <p className="text-sm text-white/60">
          After the lock deadline, players can no longer choose or change their nation.
        </p>

        {nationalityLock && (
          <div className="rounded-xl bg-black/20 p-4 text-sm text-white/70">
            <p>
              Status:{' '}
              <span className={nationalityLock.locked ? 'text-amber-300' : 'text-emerald-300'}>
                {nationalityLock.status}
              </span>
            </p>
            <p className="mt-1">
              Lock deadline (UK):{' '}
              <span className="text-white">
                {nationalityLock.lockAtLabel ?? 'Not set'}
              </span>
            </p>
          </div>
        )}

        <form onSubmit={handleNationalityLockSave} className="space-y-3">
          <label className="block text-sm text-white/70">
            Lock date/time (UK time)
            <input
              type="datetime-local"
              value={editNationalityLock}
              onChange={(e) => setEditNationalityLock(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gold-500 py-3 font-semibold text-pitch-950 disabled:opacity-60"
          >
            Save lock deadline
          </button>
        </form>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Leaderboard integrity</h2>
        <p className="text-sm text-white/60">
          Compare each player&apos;s stored points and win counts against their votes on all scored
          matches. Use this after re-applying scoring or if totals look wrong.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={auditLoading}
            onClick={handleLeaderboardAudit}
            className="rounded-xl border border-white/20 py-3 font-semibold hover:bg-white/5 disabled:opacity-50"
          >
            {auditLoading ? 'Checking…' : 'Check leaderboard'}
          </button>
          <button
            type="button"
            disabled={auditLoading}
            onClick={handleLeaderboardReconcile}
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 py-3 font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
          >
            {auditLoading ? 'Updating…' : 'Fix leaderboard'}
          </button>
        </div>

        {auditReport && (
          <div className="space-y-3 rounded-xl bg-black/20 p-4 text-sm">
            <p className="text-white/70">
              {auditReport.scoredMatchCount} scored match(es) ·{' '}
              {auditReport.voteCountOnScoredMatches} vote(s) counted ·{' '}
              {auditReport.allMatch ? (
                <span className="text-emerald-300">All players match</span>
              ) : (
                <span className="text-amber-300">
                  {auditReport.mismatches.length} mismatch(es)
                </span>
              )}
            </p>

            {auditReport.mismatches.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50">
                      <th className="py-2 pr-3 font-medium">Player</th>
                      <th className="py-2 pr-3 font-medium">Stored</th>
                      <th className="py-2 font-medium">Expected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditReport.mismatches.map((entry) => (
                      <tr key={entry.userId} className="border-b border-white/5">
                        <td className="py-2 pr-3 font-medium text-white">{entry.name}</td>
                        <td className="py-2 pr-3 text-white/60">
                          {entry.stored.points} pts · {entry.stored.correctPredictions}/
                          {entry.stored.totalPredictions} wins
                        </td>
                        <td className="py-2 text-emerald-300">
                          {entry.expected.points} pts · {entry.expected.correctPredictions}/
                          {entry.expected.totalPredictions} wins
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
