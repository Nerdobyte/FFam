import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { sortLeaderboard, type User } from './types';

function toUser(id: string, data: Record<string, unknown>): User {
  return {
    id,
    name: data.name as string,
    code: data.code as string,
    nationality: (data.nationality as string | null | undefined) ?? null,
    points: (data.points as number) ?? 0,
    correctPredictions: (data.correctPredictions as number) ?? 0,
    totalPredictions: (data.totalPredictions as number) ?? 0,
  };
}

export function subscribeUser(userId: string, onUser: (user: User | null) => void) {
  return onSnapshot(doc(db, 'users', userId), (snapshot) => {
    if (!snapshot.exists()) {
      onUser(null);
      return;
    }
    onUser(toUser(snapshot.id, snapshot.data()));
  });
}

export function subscribeLeaderboard(onUsers: (users: User[]) => void) {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    const users = snapshot.docs.map((d) => toUser(d.id, d.data()));
    onUsers(sortLeaderboard(users));
  });
}
