import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

/** Subscribe to whether Draw voting is enabled. Defaults to true if unset. */
export function subscribeDrawEnabled(onDrawEnabled: (enabled: boolean) => void) {
  return onSnapshot(doc(db, 'settings', 'voting'), (snapshot) => {
    if (!snapshot.exists()) {
      onDrawEnabled(true);
      return;
    }
    onDrawEnabled(snapshot.data()?.drawEnabled !== false);
  });
}
