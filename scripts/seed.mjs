import { initializeApp, cert, getApps } from 'firebase-admin/app';
import {
  getFirestore,
  Timestamp,
  FieldValue,
} from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { formatUkDateTime, ukKickoff } from './datetime.mjs';

const FAMILY = [
  { name: 'James', code: 'JAMES1233' },
  { name: 'Wanda', code: 'WANDA7932' },
  { name: 'Eric', code: 'ERIC2739' },
  { name: 'Lucy', code: 'LUCY9723' },
  { name: 'Alice', code: 'ALICE1283' },
  { name: 'Bonnie', code: 'BONNIE2389' },
  { name: 'Sean', code: 'SEAN4593' },
  { name: 'Suhail', code: 'SUHAIL2323' },
  { name: 'Troy', code: 'TROY6542' },
  { name: 'Bella', code: 'BELLA0981' },
  { name: 'Nellie', code: 'NELLIE3392' },
  { name: 'Sherry', code: 'SHERRY9081' },
  { name: 'Nadia', code: 'NADIA0547' },
  { name: 'Rainer', code: 'RAINER_THE_PHYSICIST' },
  { name: 'Ben', code: 'BEN_BIGGUS_DICKUS' },
  { name: 'Ozie', code: 'WIZ_OF_OZ' },
  { name: 'Rufina', code: 'RUFINA6521' },
  { name: 'Tina', code: 'BEST_GODMUM_T' },
  { name: 'Bryan', code: 'BRYAN5901' },
  { name: 'Gabriel', code: 'GABRIEL8665' },
  { name: 'Winthur', code: 'WINNY_THE_POOH' },
  { name: 'Samit', code: 'SAMIT5625' },
  { name: 'Jason', code: 'JASON2080' },
  { name: 'Reuben', code: 'REUBEN6110' },
];

function initDb() {
  if (getApps().length) return getFirestore();

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credPath) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS');

  const sa = JSON.parse(readFileSync(credPath, 'utf8'));

  initializeApp({
    credential: cert(sa),
  });

  return getFirestore();
}

async function main() {
  const db = initDb();
  const batch = db.batch();

  console.log('\n--- Seeding users ---');

  for (const member of FAMILY) {
    const ref = db.collection('users').doc(member.name.toLowerCase());

    batch.set(
      ref,
      {
        name: member.name,
        code: member.code,
        points: 0,
        correctPredictions: 0,
        totalPredictions: 0,
      },
      { merge: true },
    );

    console.log(`User: ${member.name}`);
  }

  // Kickoff times are UK wall-clock (Europe/London), stored as UTC in Firestore.
  const matches = [
    {
      id: '2026-06-11-mex-rsa',
      teamA: 'Mexico',
      teamB: 'South Africa',
      kickoff: [2026, 6, 11, 20, 0],
    },
    {
      id: '2026-06-12-kor-cze',
      teamA: 'South Korea',
      teamB: 'Czechia',
      kickoff: [2026, 6, 12, 3, 0],
    },
    {
      id: '2026-06-12-can-bos',
      teamA: 'Canada',
      teamB: 'Bosnia and Herzegovina',
      kickoff: [2026, 6, 12, 20, 0],
    },
    {
      id: '2026-06-13-qua-swi',
      teamA: 'Qatar',
      teamB: 'Switzerland',
      kickoff: [2026, 6, 13, 20, 0],
    },
    {
      id: '2026-06-13-bra-mor',
      teamA: 'Brazil',
      teamB: 'Morocco',
      kickoff: [2026, 6, 13, 23, 0],
    },
    {
      id: '2026-06-13-usa-par',
      teamA: 'USA',
      teamB: 'Paraguay',
      kickoff: [2026, 6, 13, 2, 0],
    },
  ];

  console.log('\n--- Seeding matches (kickoffs in UK time) ---');

  for (const m of matches) {
    const [year, month, day, hour, minute] = m.kickoff;
    const start = ukKickoff(year, month, day, hour, minute);

    const end = new Date(start);
    end.setUTCHours(end.getUTCHours() + 2);

    batch.set(db.collection('matches').doc(m.id), {
      teamA: m.teamA,
      teamB: m.teamB,
      startTime: Timestamp.fromDate(start),
      endTime: Timestamp.fromDate(end),
      result: null,
      completed: false,
      scored: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(
      `✔ ${m.teamA} vs ${m.teamB} → ${formatUkDateTime(start)} (${start.toISOString()})`,
    );
  }

  await batch.commit();

  console.log('\n✅ Seed complete');
}

main().catch((e) => {
  console.error('\n❌ Seed failed:\n', e);
  process.exit(1);
});
