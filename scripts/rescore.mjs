/**
 * Re-apply scoring for a match (resets scored=false, then settles).
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *   node scripts/rescore.mjs MATCH_ID
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

function initDb() {
  if (getApps().length) return getFirestore();
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credPath) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS');
  const sa = JSON.parse(readFileSync(credPath, 'utf8'));
  initializeApp({ credential: cert(sa) });
  return getFirestore();
}

function readPrediction(data) {
  return data.prediction ?? data.choice ?? null;
}

async function main() {
  const matchId = process.argv[2];
  if (!matchId) {
    console.error('Usage: node scripts/rescore.mjs MATCH_ID');
    process.exit(1);
  }

  const db = initDb();
  const matchRef = db.collection('matches').doc(matchId);
  const matchSnap = await matchRef.get();
  if (!matchSnap.exists) throw new Error('Match not found');

  const match = matchSnap.data();
  const result = match.result;
  if (!result) throw new Error('Match has no result');

  const byField = await db.collection('votes').where('matchId', '==', matchId).get();
  let voteDocs = byField.docs;
  if (voteDocs.length === 0) {
    const all = await db.collection('votes').get();
    voteDocs = all.docs.filter((d) => d.id.startsWith(`${matchId}_`));
  }

  console.log(`Match: ${match.teamA} vs ${match.teamB}`);
  console.log(`Result: ${result}`);
  console.log(`Votes found: ${voteDocs.length}`);

  if (voteDocs.length === 0) {
    console.error('\nNo votes found. Check votes collection — matchId must match exactly.');
    const all = await db.collection('votes').get();
    if (all.size > 0) {
      console.log('\nExisting vote documents:');
      all.docs.forEach((d) => console.log(`  ${d.id}`, d.data()));
    }
    process.exit(1);
  }

  await matchRef.update({ scored: false });

  let pointsAwarded = 0;
  for (const voteDoc of voteDocs) {
    const { userId } = voteDoc.data();
    const prediction = readPrediction(voteDoc.data());
    const isCorrect = prediction === result;
    if (isCorrect) pointsAwarded++;

    const updates = { totalPredictions: FieldValue.increment(1) };
    if (isCorrect) {
      updates.correctPredictions = FieldValue.increment(1);
      updates.points = FieldValue.increment(1);
    }
    await db.collection('users').doc(userId).set(updates, { merge: true });
    console.log(`  ${userId}: ${prediction} ${isCorrect ? '✓ +1' : '✗'}`);
  }

  await matchRef.update({ scored: true, completed: true, result });
  console.log(`\nDone. ${pointsAwarded}/${voteDocs.length} awarded a point.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
