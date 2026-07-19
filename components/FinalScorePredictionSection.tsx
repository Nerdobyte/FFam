'use client';

import { useEffect, useState } from 'react';
import { subscribeFinalScorePrediction } from '@/lib/final-score-client';
import type { User } from '@/lib/types';

interface FinalScorePredictionSectionProps {
  user: User;
}

interface FinalScoreStatus {
  enabled: boolean;
  locked: boolean;
  lockTimeLabel: string | null;
  finalTeamA: string;
  finalTeamB: string;
}

interface PredictionRow {
  userId: string;
  userName: string;
  scoreTeamA: number | null;
  scoreTeamB: number | null;
}

export function FinalScorePredictionSection({ user }: FinalScorePredictionSectionProps) {
  const [status, setStatus] = useState<FinalScoreStatus | null>(null);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [submitted, setSubmitted] = useState<{ scoreTeamA: number; scoreTeamB: number } | null>(
    null,
  );
  const [predictions, setPredictions] = useState<PredictionRow[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/final-score/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setStatus({
            enabled: data.enabled === true,
            locked: data.locked === true,
            lockTimeLabel: data.lockTimeLabel ?? null,
            finalTeamA: data.finalTeamA ?? 'Team A',
            finalTeamB: data.finalTeamB ?? 'Team B',
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const unsub = subscribeFinalScorePrediction(user.id, (prediction) => {
      if (prediction) {
        setSubmitted(prediction);
        setScoreA(String(prediction.scoreTeamA));
        setScoreB(String(prediction.scoreTeamB));
      } else {
        setSubmitted(null);
      }
    });
    return () => unsub();
  }, [user.id]);

  useEffect(() => {
    if (!status?.locked) {
      setPredictions(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { auth } = await import('@/lib/firebase');
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const res = await fetch(`/api/final-score/predictions?userId=${encodeURIComponent(user.id)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPredictions(data.predictions ?? []);
      } catch {
        // Keep the locked UI usable even if the reveal table fails to load.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status?.locked, user.id]);

  if (!status || !status.enabled) {
    return null;
  }

  const locked = status.locked;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;

    const a = Number(scoreA);
    const b = Number(scoreB);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
      setError('Enter whole numbers of 0 or more for both scores.');
      setMessage('');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const { auth } = await import('@/lib/firebase');
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/final-score', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id, scoreTeamA: a, scoreTeamB: b }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setSubmitted({ scoreTeamA: data.scoreTeamA, scoreTeamB: data.scoreTeamB });
      setMessage('Prediction saved!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400">🏆 World Cup Final</p>
      <h2 className="mt-1 text-lg font-bold text-white">
        {status.finalTeamA} vs {status.finalTeamB}
      </h2>
      <p className="mt-1 text-sm text-white/60">Predict the final score</p>

      <form onSubmit={handleSave} className="mt-4">
        <div className="flex items-center justify-center gap-3">
          <span className="min-w-[70px] text-right text-sm font-semibold text-white">
            {status.finalTeamA}
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value)}
            disabled={locked || saving}
            required
            aria-label={`${status.finalTeamA} score`}
            className="w-16 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-lg text-white disabled:opacity-60"
          />
          <span className="text-lg font-bold text-white/50">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value)}
            disabled={locked || saving}
            required
            aria-label={`${status.finalTeamB} score`}
            className="w-16 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-lg text-white disabled:opacity-60"
          />
          <span className="min-w-[70px] text-left text-sm font-semibold text-white">
            {status.finalTeamB}
          </span>
        </div>

        {!locked && (
          <button
            type="submit"
            disabled={saving}
            className="mt-4 w-full rounded-xl bg-gold-500 py-3 font-semibold text-pitch-950 disabled:opacity-60"
          >
            {saving ? 'Saving…' : submitted ? 'Update prediction' : 'Submit prediction'}
          </button>
        )}
      </form>

      {locked ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <p className="font-semibold">Predictions locked</p>
            {submitted ? (
              <p className="mt-1">
                Your prediction: {status.finalTeamA} {submitted.scoreTeamA} – {submitted.scoreTeamB}{' '}
                {status.finalTeamB}
              </p>
            ) : (
              <p className="mt-1">You did not submit a prediction.</p>
            )}
          </div>

          {predictions && (
            <div className="overflow-x-auto rounded-xl bg-black/20 p-3">
              <table className="w-full min-w-[240px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/50">
                    <th className="py-2 pr-3 font-medium">User</th>
                    <th className="py-2 font-medium">
                      Prediction ({status.finalTeamA} – {status.finalTeamB})
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((row) => (
                    <tr
                      key={row.userId}
                      className={`border-b border-white/5 ${row.userId === user.id ? 'text-gold-300' : 'text-white'}`}
                    >
                      <td className="py-2 pr-3 font-medium">{row.userName}</td>
                      <td className="py-2 tabular-nums">
                        {row.scoreTeamA !== null && row.scoreTeamB !== null
                          ? `${row.scoreTeamA} – ${row.scoreTeamB}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        status.lockTimeLabel && (
          <p className="mt-3 text-center text-xs text-white/50">
            Predictions lock: {status.lockTimeLabel}
          </p>
        )
      )}

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
