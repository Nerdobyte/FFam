import { getAdminDb } from './firebase-admin';

const SETTINGS_DOC = 'voting';

export interface VotingSettings {
  /** When false, users cannot pick Draw. Defaults to true if unset. */
  drawEnabled: boolean;
}

export async function getVotingSettings(): Promise<VotingSettings> {
  const snap = await getAdminDb().collection('settings').doc(SETTINGS_DOC).get();
  if (!snap.exists) return { drawEnabled: true };
  return { drawEnabled: snap.data()?.drawEnabled !== false };
}

export async function setDrawEnabled(drawEnabled: boolean): Promise<void> {
  await getAdminDb()
    .collection('settings')
    .doc(SETTINGS_DOC)
    .set({ drawEnabled }, { merge: true });
}
