import {
  Timestamp,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Prediction } from './types';

interface VoteDoc {
  matchId: string;
  userId: string;
  prediction: Prediction;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export function voteDocId(matchId: string, userId: string): string {
  return `${matchId}_${userId}`;
}

export async function submitVote(
  matchId: string,
  userId: string,
  prediction: Prediction,
): Promise<void> {
  const id = voteDocId(matchId, userId);
  const ref = doc(db, 'votes', id);
  const existing = await getDoc(ref);

  if (existing.exists()) {
    await updateDoc(ref, {
      prediction,
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      matchId,
      userId,
      prediction,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export function subscribeUserPrediction(
  matchId: string,
  userId: string,
  onPrediction: (prediction: Prediction | null) => void,
) {
  const voteRef = doc(db, 'votes', voteDocId(matchId, userId));
  return onSnapshot(voteRef, (snapshot) => {
    if (!snapshot.exists()) {
      onPrediction(null);
      return;
    }
    onPrediction(snapshot.data().prediction as Prediction);
  });
}

export async function fetchCommunityTotals(
  matchId: string,
  userId: string,
): Promise<{ teamA: number; teamB: number } | null> {
  const { auth } = await import('./firebase');
  const user = auth.currentUser;
  if (!user) return null;

  const token = await user.getIdToken();
  const res = await fetch('/api/votes/totals', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ matchId, userId }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.totals;
}
