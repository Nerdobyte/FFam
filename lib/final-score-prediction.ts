import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from './firebase-admin';

const SETTINGS_DOC = 'finalScorePrediction';
const PREDICTIONS_COLLECTION = 'finalScorePredictions';

const DEFAULT_TEAM_A = 'Spain';
const DEFAULT_TEAM_B = 'Argentina';

export interface FinalScoreSettings {
  /** Whether the prediction card is shown to users. Set true once admin saves. */
  enabled: boolean;
  /** Manual lock override — when true, predictions are locked regardless of time. */
  locked: boolean;
  /** Automatic lock time (UK time stored as UTC). */
  lockTime: Date | null;
  finalTeamA: string;
  finalTeamB: string;
}

export interface FinalScorePrediction {
  scoreTeamA: number;
  scoreTeamB: number;
  updatedAt: Date | null;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

export async function getFinalScoreSettings(): Promise<FinalScoreSettings> {
  const snap = await getAdminDb().collection('settings').doc(SETTINGS_DOC).get();
  if (!snap.exists) {
    return {
      enabled: false,
      locked: false,
      lockTime: null,
      finalTeamA: DEFAULT_TEAM_A,
      finalTeamB: DEFAULT_TEAM_B,
    };
  }

  const data = snap.data() ?? {};
  return {
    enabled: data.enabled === true,
    locked: data.locked === true,
    lockTime: toDate(data.lockTime),
    finalTeamA: (data.finalTeamA as string) || DEFAULT_TEAM_A,
    finalTeamB: (data.finalTeamB as string) || DEFAULT_TEAM_B,
  };
}

/** Server-authoritative lock check. Uses the provided server-side `now`. */
export function isFinalScoreLocked(settings: FinalScoreSettings, now = new Date()): boolean {
  if (settings.locked) return true;
  if (settings.lockTime && now >= settings.lockTime) return true;
  return false;
}

export async function saveFinalScoreSettings(input: {
  locked: boolean;
  lockTime: Date | null;
  finalTeamA: string;
  finalTeamB: string;
}): Promise<void> {
  await getAdminDb()
    .collection('settings')
    .doc(SETTINGS_DOC)
    .set(
      {
        enabled: true,
        locked: input.locked,
        lockTime: input.lockTime ? Timestamp.fromDate(input.lockTime) : null,
        finalTeamA: input.finalTeamA,
        finalTeamB: input.finalTeamB,
      },
      { merge: true },
    );
}

export async function getFinalScorePrediction(
  userId: string,
): Promise<FinalScorePrediction | null> {
  const snap = await getAdminDb().collection(PREDICTIONS_COLLECTION).doc(userId).get();
  if (!snap.exists) return null;

  const data = snap.data() ?? {};
  return {
    scoreTeamA: (data.scoreTeamA as number) ?? 0,
    scoreTeamB: (data.scoreTeamB as number) ?? 0,
    updatedAt: toDate(data.updatedAt),
  };
}

export async function saveFinalScorePrediction(
  userId: string,
  scoreTeamA: number,
  scoreTeamB: number,
): Promise<void> {
  await getAdminDb()
    .collection(PREDICTIONS_COLLECTION)
    .doc(userId)
    .set(
      {
        scoreTeamA,
        scoreTeamB,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}
