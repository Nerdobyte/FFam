'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureAnonymousAuth, loginWithCode } from '@/lib/auth';
import { getStoredUserId } from '@/lib/session';

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    ensureAnonymousAuth().catch(() => {});
    if (getStoredUserId()) {
      router.replace('/');
      return;
    }
    setChecking(false);
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithCode(code);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/70">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gold-500 text-3xl shadow-xl shadow-gold-500/30">
          ⚽
        </div>
        <h1 className="text-4xl font-extrabold">Family FIFA Voting</h1>
        <p className="mt-2 text-white/60">Enter your invite code to join the sweepstake.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md"
      >
        <label className="block">
          <span className="mb-2 block text-sm text-white/70">Invite code</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. MOM2026"
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-center text-lg tracking-widest text-white outline-none ring-gold-400 transition focus:ring-2"
          />
        </label>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-gold-500 px-4 py-3 font-semibold text-pitch-950 transition hover:bg-gold-400 disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Enter'}
        </button>
      </form>
    </div>
  );
}
