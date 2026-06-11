import { signInAnonymously } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { setStoredUserId } from './session';
import type { User } from './types';

async function clearSessionBindings() {
  if (!auth.currentUser) return;
  const bound = await getDocs(
    query(collection(db, 'users'), where('authUid', '==', auth.currentUser.uid)),
  );
  await Promise.all(bound.docs.map((d) => updateDoc(d.ref, { authUid: null })));
}

async function bindUser(userId: string) {
  if (!auth.currentUser) throw new Error('Not authenticated');
  await clearSessionBindings();
  await updateDoc(doc(db, 'users', userId), { authUid: auth.currentUser.uid });
}

export async function loginWithCode(code: string): Promise<User> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) throw new Error('Enter your invite code');

  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  const snapshot = await getDocs(
    query(collection(db, 'users'), where('code', '==', normalized)),
  );

  if (snapshot.empty) {
    throw new Error('Invalid invite code');
  }

  const userDoc = snapshot.docs[0];
  const data = userDoc.data();

  await bindUser(userDoc.id);

  const user: User = {
    id: userDoc.id,
    name: data.name,
    code: data.code,
    points: data.points ?? 0,
    correctPredictions: data.correctPredictions ?? 0,
    totalPredictions: data.totalPredictions ?? 0,
  };

  setStoredUserId(user.id);
  return user;
}

export async function ensureAnonymousAuth() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
}

export async function rebindSession(userId: string) {
  await ensureAnonymousAuth();
  await bindUser(userId);
}

export async function logoutUser(_userId: string) {
  await clearSessionBindings();
}
