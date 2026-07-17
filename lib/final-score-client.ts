import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export interface FinalScorePredictionValue {
  scoreTeamA: number;
  scoreTeamB: number;
}

export function subscribeFinalScorePrediction(
  userId: string,
  onPrediction: (prediction: FinalScorePredictionValue | null) => void,
) {
  const ref = doc(db, 'finalScorePredictions', userId);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        onPrediction(null);
        return;
      }
      const data = snapshot.data();
      onPrediction({
        scoreTeamA: (data.scoreTeamA as number) ?? 0,
        scoreTeamB: (data.scoreTeamB as number) ?? 0,
      });
    },
    () => onPrediction(null),
  );
}
