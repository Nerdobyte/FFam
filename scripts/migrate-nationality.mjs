/**
 * One-time migration: add nationality: null to all users.
 * Does not modify points, votes, or other fields.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *   node scripts/migrate-nationality.mjs
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

function initDb() {
  if (getApps().length) return getFirestore();
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credPath) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS');
  const sa = JSON.parse(readFileSync(credPath, 'utf8'));
  initializeApp({ credential: cert(sa) });
  return getFirestore();
}

async function main() {
  const db = initDb();
  const usersSnap = await db.collection('users').get();

  console.log(`\nMigrating ${usersSnap.size} user(s)…`);

  const batch = db.batch();
  usersSnap.docs.forEach((doc) => {
    batch.set(doc.ref, { nationality: null }, { merge: true });
    console.log(`  ${doc.data().name ?? doc.id} → nationality: null`);
  });

  await batch.commit();
  console.log('\n✅ Migration complete');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
