import { initializeApp, cert, getApps } from 'firebase-admin/app';
import {
  getFirestore,
  Timestamp,
  FieldValue,
} from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { formatUkDateTime, ukKickoff } from './datetime.mjs';

const FAMILY = [
  { name: 'Mom', code: 'MOM2026' },
  { name: 'Dad', code: 'DAD2026' },
  { name: 'Alex', code: 'ALEX2026' },
  { name: 'Sam', code: 'SAM2026' },
  { name: 'Ben', code: 'BEN2026' },
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
