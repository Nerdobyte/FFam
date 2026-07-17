'use client';

import { useEffect, useState } from 'react';
import { formatUkDateTime, toUkDatetimeLocal, ukDatetimeLocalToIso } from '@/lib/datetime';
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

interface AdminUser {
  id: string;
  name: string;
}

interface FinalScoreSettingsState {
  enabled: boolean;
  manualLocked: boolean;
  locked: boolean;
  lockTime: string | null;
  lockTimeLabel: string | null;
  finalTeamA: string;
  finalTeamB: string;
  status: 'Locked' | 'Open';
}

interface BonusPointAward {
  id: string;
  userId: string;
  userName: string;
  matchId: string;
  matchLabel: string;
  points: number;
  reason: string | null;
  createdAt: string;
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
  const [drawDisabled, setDrawDisabled] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [bonusAwards, setBonusAwards] = useState<BonusPointAward[]>([]);
  const [bonusMatchId, setBonusMatchId] = useState('');
  const [bonusUserId, setBonusUserId] = useState('');
  const [bonusPoints, setBonusPoints] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const [bonusLoading, setBonusLoading] = useState(false);
  const [finalScore, setFinalScore] = useState<FinalScoreSettingsState | null>(null);
  const [finalScoreLockTime, setFinalScoreLockTime] = useState('');
  const [finalScoreManualLocked, setFinalScoreManualLocked] = useState(false);
  const [finalTeamA, setFinalTeamA] = useState('Spain');
  const [finalTeamB, setFinalTeamB] = useState('Argentina');

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

  const loadVotingSettings = async () => {
    const res = await fetch('/api/admin/voting-settings');
    if (!res.ok) return null;
    const data = await res.json();
    setDrawDisabled(data.drawDisabled === true);
    return data;
  };

  const loadUsers = async () => {
    const res = await fetch('/api/admin/users');
    if (!res.ok) return [];
    const data = await res.json();
    setUsers(data.users);
    if (data.users.length > 0 && !bonusUserId) {
      setBonusUserId(data.users[0].id);
    }
    return data.users as AdminUser[];
  };

  const loadBonusAwards = async () => {
    const res = await fetch('/api/admin/bonus-points');
    if (!res.ok) return [];
    const data = await res.json();
    setBonusAwards(data.awards);
    return data.awards as BonusPointAward[];
  };

  const applyFinalScore = (data: FinalScoreSettingsState) => {
    setFinalScore(data);
    setFinalScoreManualLocked(data.manualLocked);
    setFinalTeamA(data.finalTeamA);
    setFinalTeamB(data.finalTeamB);
    if (data.lockTime) {
      setFinalScoreLockTime(toUkDatetimeLocal(data.lockTime));
    }
  };

  const loadFinalScore = async () => {
    const res = await fetch('/api/admin/final-score');
    if (!res.ok) return null;
    const data = (await res.json()) as FinalScoreSettingsState;
    applyFinalScore(data);
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
      if (!bonusMatchId) setBonusMatchId(current.id);
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
            setBonusMatchId(current.id);
          }
          loadNationalityLock().catch(() => {});
          loadVotingSettings().catch(() => {});
          loadUsers().catch(() => {});
          loadBonusAwards().catch(() => {});
          loadFinalScore().catch(() => {});
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
      await loadVotingSettings();
      await loadUsers();
      await loadBonusAwards();
      await loadFinalScore();
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

  const handleDrawDisabledToggle = async () => {
    const next = !drawDisabled;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/voting-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawDisabled: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setDrawDisabled(next);
      setMessage(next ? 'Draw button disabled for users.' : 'Draw button enabled for users.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
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

  const handleAwardBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    const points = Number(bonusPoints);
    if (!bonusMatchId || !bonusUserId || !Number.isInteger(points) || points === 0) {
      setMessage('Select a match and user, and enter a non-zero whole number of points.');
      return;
    }

    setBonusLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/bonus-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: bonusMatchId,
          userId: bonusUserId,
          points,
          reason: bonusReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to award bonus');
      setMessage(
        `Awarded ${points > 0 ? '+' : ''}${points} bonus point(s) to ${data.award.userName}.`,
      );
      setBonusPoints('');
      setBonusReason('');
      await loadBonusAwards();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to award bonus');
    } finally {
      setBonusLoading(false);
    }
  };

  const handleDeleteBonus = async (id: string) => {
    setBonusLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/bonus-points/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete bonus');
      setMessage('Bonus point award removed.');
      await loadBonusAwards();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to delete bonus');
    } finally {
      setBonusLoading(false);
    }
  };

  const handleFinalScoreSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalTeamA.trim() || !finalTeamB.trim()) {
      setMessage('Both team names are required for the final score prediction.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/final-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locked: finalScoreManualLocked,
          lockTime: finalScoreLockTime ? ukDatetimeLocalToIso(finalScoreLockTime) : null,
          finalTeamA: finalTeamA.trim(),
          finalTeamB: finalTeamB.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      applyFinalScore(data);
      setMessage(
        `Final score prediction saved — ${data.status}${data.lockTimeLabel ? ` (locks ${data.lockTimeLabel})` : ''}.`,
      );
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
        <h2 className="text-lg font-semibold">Voting options</h2>
        <p className="text-sm text-white/60">
          Control which options users see when casting predictions.
        </p>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <input
            type="checkbox"
            checked={drawDisabled}
            disabled={loading}
            onChange={handleDrawDisabledToggle}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30 accent-gold-500"
          />
          <span>
            <span className="block text-sm font-medium text-white">Disable Draw button</span>
            <span className="mt-1 block text-sm text-white/50">
              When enabled, the Draw option is hidden on the user page and cannot be voted for.
            </span>
          </span>
        </label>
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
        <h2 className="text-lg font-semibold">World Cup Final Score Prediction Settings</h2>
        <p className="text-sm text-white/60">
          Standalone exact-score prediction, separate from the normal match winner vote. Saving
          enables the card on the homepage for all users.
        </p>

        {finalScore && (
          <div className="rounded-xl bg-black/20 p-4 text-sm text-white/70">
            <p>
              Status:{' '}
              <span className={finalScore.locked ? 'text-amber-300' : 'text-emerald-300'}>
                {finalScore.status}
              </span>
              {finalScore.locked && finalScore.manualLocked ? ' (manual)' : ''}
            </p>
            <p className="mt-1">
              Lock time (UK):{' '}
              <span className="text-white">{finalScore.lockTimeLabel ?? 'Not set'}</span>
            </p>
            <p className="mt-1">
              Card visible to users:{' '}
              <span className="text-white">{finalScore.enabled ? 'Yes' : 'No (save to enable)'}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleFinalScoreSave} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-white/70">
              Final Team A
              <input
                value={finalTeamA}
                onChange={(e) => setFinalTeamA(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
              />
            </label>
            <label className="block text-sm text-white/70">
              Final Team B
              <input
                value={finalTeamB}
                onChange={(e) => setFinalTeamB(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
              />
            </label>
          </div>

          <label className="block text-sm text-white/70">
            Lock time (UK time)
            <input
              type="datetime-local"
              value={finalScoreLockTime}
              onChange={(e) => setFinalScoreLockTime(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
            />
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <input
              type="checkbox"
              checked={finalScoreManualLocked}
              onChange={(e) => setFinalScoreManualLocked(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30 accent-gold-500"
            />
            <span>
              <span className="block text-sm font-medium text-white">Manually lock predictions</span>
              <span className="mt-1 block text-sm text-white/50">
                When enabled, predictions are locked immediately, regardless of the lock time.
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gold-500 py-3 font-semibold text-pitch-950 disabled:opacity-60"
          >
            Save final score settings
          </button>
        </form>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Bonus Points</h2>
        <p className="text-sm text-white/60">
          Award or deduct bonus points for a specific match. Users only see their updated total on
          the leaderboard.
        </p>

        <form onSubmit={handleAwardBonus} className="space-y-3">
          <label className="block text-sm text-white/70">
            Match
            <select
              value={bonusMatchId}
              onChange={(e) => setBonusMatchId(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.teamA} vs {m.teamB}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-white/70">
            User
            <select
              value={bonusUserId}
              onChange={(e) => setBonusUserId(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-white/70">
            Points
            <input
              type="number"
              value={bonusPoints}
              onChange={(e) => setBonusPoints(e.target.value)}
              placeholder="e.g. 3 or -2"
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
            />
          </label>

          <label className="block text-sm text-white/70">
            Reason (optional)
            <input
              type="text"
              value={bonusReason}
              onChange={(e) => setBonusReason(e.target.value)}
              placeholder="e.g. Closest to correct scoreline"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
            />
          </label>

          <button
            type="submit"
            disabled={bonusLoading || users.length === 0}
            className="w-full rounded-xl bg-gold-500 py-3 font-semibold text-pitch-950 disabled:opacity-60"
          >
            {bonusLoading ? 'Saving…' : 'Award Bonus'}
          </button>
        </form>

        {bonusAwards.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50">
                  <th className="py-2 pr-3 font-medium">Match</th>
                  <th className="py-2 pr-3 font-medium">User</th>
                  <th className="py-2 pr-3 font-medium">Points</th>
                  <th className="py-2 pr-3 font-medium">Reason</th>
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {bonusAwards.map((award) => (
                  <tr key={award.id} className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">{award.matchLabel}</td>
                    <td className="py-2 pr-3 text-white">{award.userName}</td>
                    <td
                      className={`py-2 pr-3 font-medium ${award.points > 0 ? 'text-emerald-300' : 'text-red-300'}`}
                    >
                      {award.points > 0 ? '+' : ''}
                      {award.points}
                    </td>
                    <td className="py-2 pr-3 text-white/60">{award.reason ?? '—'}</td>
                    <td className="py-2 pr-3 text-white/60">
                      {formatUkDateTime(new Date(award.createdAt))}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        disabled={bonusLoading}
                        onClick={() => handleDeleteBonus(award.id)}
                        className="rounded-lg border border-red-500/30 px-2 py-1 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Leaderboard integrity</h2>
        <p className="text-sm text-white/60">
          Compare each player&apos;s stored points and win counts against their votes on all scored
          matches plus any bonus points. Use this after re-applying scoring or if totals look wrong.
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
