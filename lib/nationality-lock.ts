import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from './firebase-admin';

const SETTINGS_DOC = 'nationality';

export interface NationalityLockSettings {
  lockAt: Date | null;
}

export async function getNationalityLockSettings(): Promise<NationalityLockSettings> {
  const snap = await getAdminDb().collection('settings').doc(SETTINGS_DOC).get();
  if (!snap.exists) return { lockAt: null };

  const lockAt = snap.data()?.lockAt;
  if (lockAt instanceof Timestamp) return { lockAt: lockAt.toDate() };
  if (lockAt instanceof Date) return { lockAt };
  return { lockAt: null };
}

export function isNationalityLocked(lockAt: Date | null, now = new Date()): boolean {
  if (!lockAt) return false;
  return now >= lockAt;
}

export async function setNationalityLockAt(lockAt: Date): Promise<void> {
  await getAdminDb()
    .collection('settings')
    .doc(SETTINGS_DOC)
    .set({ lockAt: Timestamp.fromDate(lockAt) }, { merge: true });
}
