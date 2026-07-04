import { initializeApp, cert, getApps } from 'firebase-admin/app';
import {
  getFirestore,
  Timestamp,
} from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { formatUkDateTime, ukKickoff } from './datetime.mjs';

const FAMILY = [
  { name: 'James', code: 'JAMES1233' },
  { name: 'Wanda', code: 'WANDA7932' },
  //{ name: 'Eric', code: 'ERIC2739' },
  //{ name: 'Lucy', code: 'LUCY9723' },
  { name: 'Alice', code: 'ALICE1283' },
  { name: 'Bonnie', code: 'BONNIE2389' },
  { name: 'Sean', code: 'SEAN4593' },
  { name: 'Suhail', code: 'SUHAIL2323' },
  { name: 'Troy', code: 'TROY6542' },
  { name: 'Bella', code: 'BELLA0981' },
  { name: 'Nellie', code: 'NELLIE3392' },
  //{ name: 'Sherry', code: 'SHERRY9081' },
  { name: 'Nadia', code: 'NADIA_THE_DARK_QUEEN' },
  { name: 'Rainer', code: 'RAINER_THE_PHYSICIST' },
  { name: 'Ben', code: 'BEN_BIGGUS_DICKUS' },
  { name: 'Ozie', code: 'WIZ_OF_OZ' },
  //{ name: 'Rufina', code: 'RUFINA6521' },
  { name: 'Tina', code: 'BEST_GODMUM_T' },
  //{ name: 'Bryan', code: 'BRYAN5901' },
  //{ name: 'Gabriel', code: 'GABRIEL8665' },
  { name: 'Winthur', code: 'WINNY_THE_POOH' },
  { name: 'Samit', code: 'SAMIT5625' },
  { name: 'Jason', code: 'JASON2080' },
  { name: 'Reuben', code: 'REUBEN6110' },
  { name: 'Christopher', code: 'CHRIS0001' },
  { name: 'Victoria', code: 'WITCHY_VICKY' },
  { name: 'Sebastian', code: 'SEB1811' },
  { name: 'Catarina', code: 'SMOKIN_HAWT_SISTA' },
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
    //{
    //  id: '2026-06-13-qua-swi',
    //  teamA: 'Qatar',
    //  teamB: 'Switzerland',
    //  kickoff: [2026, 6, 13, 20, 0],
    //},
    //{
    //  id: '2026-06-13-bra-mor',
    //  teamA: 'Brazil',
    //  teamB: 'Morocco',
    //  kickoff: [2026, 6, 13, 23, 0],
    //},
    {
      id: '2026-06-13-usa-par',
      teamA: 'USA',
      teamB: 'Paraguay',
      kickoff: [2026, 6, 13, 2, 0],
    },
    {
    id: '2026-06-13-qat-sui',
    teamA: 'Qatar',
    teamB: 'Switzerland',
    kickoff: [2026, 6, 13, 20, 0],
    },
    {
    id: '2026-06-13-bra-mar',
    teamA: 'Brazil',
    teamB: 'Morocco',
    kickoff: [2026, 6, 13, 23, 0],
    },     
    {
    id: '2026-06-14-hai-sco',
    teamA: 'Haiti',
    teamB: 'Scotland',
    kickoff: [2026, 6, 14, 2, 0],
    },
    {
    id: '2026-06-14-aus-tur',
    teamA: 'Australia',
    teamB: 'Turkey',
    kickoff: [2026, 6, 14, 5, 0],
    },
    {
    id: '2026-06-14-ger-cur',
    teamA: 'Germany',
    teamB: 'Curacao',
    kickoff: [2026, 6, 14, 18, 0],
    },
    {
    id: '2026-06-14-ned-jpn',
    teamA: 'Netherlands',
    teamB: 'Japan',
    kickoff: [2026, 6, 14, 21, 0],
    },    
    {
    id: '2026-06-15-civ-ecu',
    teamA: 'Ivory Coast',
    teamB: 'Ecuador',
    kickoff: [2026, 6, 15, 0, 0],
    },
    {
    id: '2026-06-15-swe-tun',
    teamA: 'Sweden',
    teamB: 'Tunisia',
    kickoff: [2026, 6, 15, 3, 0],
    },
    {
    id: '2026-06-15-esp-cpv',
    teamA: 'Spain',
    teamB: 'Cape Verde',
    kickoff: [2026, 6, 15, 17, 0],
    },
    {
    id: '2026-06-15-bel-egy',
    teamA: 'Belgium',
    teamB: 'Egypt',
    kickoff: [2026, 6, 15, 20, 0],
    },
    {
    id: '2026-06-15-sau-uru',
    teamA: 'Saudi Arabia',
    teamB: 'Uruguay',
    kickoff: [2026, 6, 15, 23, 0],
    },      
    {
    id: '2026-06-16-irn-nzl',
    teamA: 'Iran',
    teamB: 'New Zealand',
    kickoff: [2026, 6, 16, 2, 0],
    },
    {
    id: '2026-06-16-fra-sen',
    teamA: 'France',
    teamB: 'Senegal',
    kickoff: [2026, 6, 16, 20, 0],
    },
    {
    id: '2026-06-16-irq-nor',
    teamA: 'Iraq',
    teamB: 'Norway',
    kickoff: [2026, 6, 16, 23, 0],
    },      
    {
    id: '2026-06-17-arg-alg',
    teamA: 'Argentina',
    teamB: 'Algeria',
    kickoff: [2026, 6, 17, 2, 0],
    },
    {
    id: '2026-06-17-aut-jor',
    teamA: 'Austria',
    teamB: 'Jordan',
    kickoff: [2026, 6, 17, 5, 0],
    },
    {
    id: '2026-06-17-por-cod',
    teamA: 'Portugal',
    teamB: 'DR Congo',
    kickoff: [2026, 6, 17, 18, 0],
    },
    {
    id: '2026-06-17-eng-cro',
    teamA: 'England',
    teamB: 'Croatia',
    kickoff: [2026, 6, 17, 21, 0],
    },    
    {
    id: '2026-06-18-gha-pan',
    teamA: 'Ghana',
    teamB: 'Panama',
    kickoff: [2026, 6, 18, 0, 0],
    },
    {
    id: '2026-06-18-uzb-col',
    teamA: 'Uzbekistan',
    teamB: 'Colombia',
    kickoff: [2026, 6, 18, 3, 0],
    },
    {
    id: '2026-06-18-cze-rsa',
    teamA: 'Czechia',
    teamB: 'South Africa',
    kickoff: [2026, 6, 18, 17, 0],
    },
    {
    id: '2026-06-18-sui-bih',
    teamA: 'Switzerland',
    teamB: 'Bosnia and Herzegovina',
    kickoff: [2026, 6, 18, 20, 0],
    },
    {
    id: '2026-06-18-can-qat',
    teamA: 'Canada',
    teamB: 'Qatar',
    kickoff: [2026, 6, 18, 23, 0],
    },
    {
      id: '2026-06-19-mex-kor',
      teamA: 'Mexico',
      teamB: 'South Korea',
      kickoff: [2026, 6, 19, 2, 0],
    },
    {
      id: '2026-06-19-usa-aus',
      teamA: 'USA',
      teamB: 'Australia',
      kickoff: [2026, 6, 19, 20, 0],
    },
    {
      id: '2026-06-19-sco-mar',
      teamA: 'Scotland',
      teamB: 'Morocco',
      kickoff: [2026, 6, 19, 23, 0],
    },
  
    {
      id: '2026-06-20-bra-hai',
      teamA: 'Brazil',
      teamB: 'Haiti',
      kickoff: [2026, 6, 20, 1, 30],
    },
    {
      id: '2026-06-20-tur-par',
      teamA: 'Turkey',
      teamB: 'Paraguay',
      kickoff: [2026, 6, 20, 4, 0],
    },
    {
      id: '2026-06-20-ned-swe',
      teamA: 'Netherlands',
      teamB: 'Sweden',
      kickoff: [2026, 6, 20, 18, 0],
    },
    {
      id: '2026-06-20-ger-civ',
      teamA: 'Germany',
      teamB: 'Ivory Coast',
      kickoff: [2026, 6, 20, 21, 0],
    },
  
    {
      id: '2026-06-21-ecu-cur',
      teamA: 'Ecuador',
      teamB: 'Curacao',
      kickoff: [2026, 6, 21, 1, 0],
    },
    {
      id: '2026-06-21-tun-jpn',
      teamA: 'Tunisia',
      teamB: 'Japan',
      kickoff: [2026, 6, 21, 5, 0],
    },
    {
      id: '2026-06-21-esp-sau',
      teamA: 'Spain',
      teamB: 'Saudi Arabia',
      kickoff: [2026, 6, 21, 17, 0],
    },
    {
      id: '2026-06-21-bel-irn',
      teamA: 'Belgium',
      teamB: 'Iran',
      kickoff: [2026, 6, 21, 20, 0],
    },
    {
      id: '2026-06-21-uru-cpv',
      teamA: 'Uruguay',
      teamB: 'Cape Verde',
      kickoff: [2026, 6, 21, 23, 0],
    },
  
    {
      id: '2026-06-22-nzl-egy',
      teamA: 'New Zealand',
      teamB: 'Egypt',
      kickoff: [2026, 6, 22, 2, 0],
    },
    {
      id: '2026-06-22-arg-aut',
      teamA: 'Argentina',
      teamB: 'Austria',
      kickoff: [2026, 6, 22, 18, 0],
    },
    {
      id: '2026-06-22-fra-irq',
      teamA: 'France',
      teamB: 'Iraq',
      kickoff: [2026, 6, 22, 22, 0],
    },
  
    {
      id: '2026-06-23-nor-sen',
      teamA: 'Norway',
      teamB: 'Senegal',
      kickoff: [2026, 6, 23, 1, 0],
    },
    {
      id: '2026-06-23-jor-alg',
      teamA: 'Jordan',
      teamB: 'Algeria',
      kickoff: [2026, 6, 23, 4, 0],
    },
    {
      id: '2026-06-23-por-uzb',
      teamA: 'Portugal',
      teamB: 'Uzbekistan',
      kickoff: [2026, 6, 23, 18, 0],
    },
    {
      id: '2026-06-23-eng-gha',
      teamA: 'England',
      teamB: 'Ghana',
      kickoff: [2026, 6, 23, 21, 0],
    },
  
    {
      id: '2026-06-24-pan-cro',
      teamA: 'Panama',
      teamB: 'Croatia',
      kickoff: [2026, 6, 24, 0, 0],
    },
    {
      id: '2026-06-24-col-cod',
      teamA: 'Colombia',
      teamB: 'DR Congo',
      kickoff: [2026, 6, 24, 3, 0],
    },
    {
      id: '2026-06-24-sui-can',
      teamA: 'Switzerland',
      teamB: 'Canada',
      kickoff: [2026, 6, 24, 20, 0],
    },
    {
      id: '2026-06-24-bih-qat',
      teamA: 'Bosnia and Herzegovina',
      teamB: 'Qatar',
      kickoff: [2026, 6, 24, 20, 0],
    },
    {
      id: '2026-06-24-mar-hai',
      teamA: 'Morocco',
      teamB: 'Haiti',
      kickoff: [2026, 6, 24, 23, 0],
    },
    {
      id: '2026-06-24-sco-bra',
      teamA: 'Scotland',
      teamB: 'Brazil',
      kickoff: [2026, 6, 24, 23, 0],
    },
  
    {
      id: '2026-06-25-rsa-kor',
      teamA: 'South Africa',
      teamB: 'South Korea',
      kickoff: [2026, 6, 25, 2, 0],
    },
    {
      id: '2026-06-25-cze-mex',
      teamA: 'Czechia',
      teamB: 'Mexico',
      kickoff: [2026, 6, 25, 2, 0],
    },
    {
      id: '2026-06-25-cur-civ',
      teamA: 'Curacao',
      teamB: 'Ivory Coast',
      kickoff: [2026, 6, 25, 21, 0],
    },
    {
      id: '2026-06-25-ecu-ger',
      teamA: 'Ecuador',
      teamB: 'Germany',
      kickoff: [2026, 6, 25, 21, 0],
    },
  
    {
      id: '2026-06-26-tun-ned',
      teamA: 'Tunisia',
      teamB: 'Netherlands',
      kickoff: [2026, 6, 26, 0, 0],
    },
    {
      id: '2026-06-26-jpn-swe',
      teamA: 'Japan',
      teamB: 'Sweden',
      kickoff: [2026, 6, 26, 0, 0],
    },
    {
      id: '2026-06-26-tur-usa',
      teamA: 'Turkey',
      teamB: 'USA',
      kickoff: [2026, 6, 26, 3, 0],
    },
    {
      id: '2026-06-26-par-aus',
      teamA: 'Paraguay',
      teamB: 'Australia',
      kickoff: [2026, 6, 26, 3, 0],
    },
    {
      id: '2026-06-26-nor-fra',
      teamA: 'Norway',
      teamB: 'France',
      kickoff: [2026, 6, 26, 20, 0],
    },
    {
      id: '2026-06-26-sen-irq',
      teamA: 'Senegal',
      teamB: 'Iraq',
      kickoff: [2026, 6, 26, 20, 0],
    },
  
    {
      id: '2026-06-27-cpv-sau',
      teamA: 'Cape Verde',
      teamB: 'Saudi Arabia',
      kickoff: [2026, 6, 27, 1, 0],
    },
    {
      id: '2026-06-27-uru-esp',
      teamA: 'Uruguay',
      teamB: 'Spain',
      kickoff: [2026, 6, 27, 1, 0],
    },
    {
      id: '2026-06-27-nzl-bel',
      teamA: 'New Zealand',
      teamB: 'Belgium',
      kickoff: [2026, 6, 27, 4, 0],
    },
    {
      id: '2026-06-27-egy-irn',
      teamA: 'Egypt',
      teamB: 'Iran',
      kickoff: [2026, 6, 27, 4, 0],
    },
    {
      id: '2026-06-27-pan-eng',
      teamA: 'Panama',
      teamB: 'England',
      kickoff: [2026, 6, 27, 22, 0],
    },
    {
      id: '2026-06-27-cro-gha',
      teamA: 'Croatia',
      teamB: 'Ghana',
      kickoff: [2026, 6, 27, 22, 0],
    },
  
    {
      id: '2026-06-28-col-por',
      teamA: 'Colombia',
      teamB: 'Portugal',
      kickoff: [2026, 6, 28, 0, 30],
    },
    {
      id: '2026-06-28-cod-uzb',
      teamA: 'DR Congo',
      teamB: 'Uzbekistan',
      kickoff: [2026, 6, 28, 0, 30],
    },
    {
      id: '2026-06-28-alg-aut',
      teamA: 'Algeria',
      teamB: 'Austria',
      kickoff: [2026, 6, 28, 3, 0],
    },
    {
      id: '2026-06-28-jor-arg',
      teamA: 'Jordan',
      teamB: 'Argentina',
      kickoff: [2026, 6, 28, 3, 0],
    },
    {
      id: '2026-06-28-zaf-can',
      teamA: 'South Africa',
      teamB: 'Canada',
      kickoff: [2026, 6, 28, 20, 0],
    },
    {
      id: '2026-06-29-bra-jpn',
      teamA: 'Brazil',
      teamB: 'Japan',
      kickoff: [2026, 6, 29, 18, 0],
    },
    {
      id: '2026-06-29-deu-pry',
      teamA: 'Germany',
      teamB: 'Paraguay',
      kickoff: [2026, 6, 29, 21, 30],
    },
    {
      id: '2026-06-30-nld-mar',
      teamA: 'Netherlands',
      teamB: 'Morocco',
      kickoff: [2026, 6, 30, 2, 0],
    },
    {
      id: '2026-06-30-civ-nor',
      teamA: 'Ivory Coast',
      teamB: 'Norway',
      kickoff: [2026, 6, 30, 18, 0],
    },
    {
      id: '2026-06-30-fra-swe',
      teamA: 'France',
      teamB: 'Sweden',
      kickoff: [2026, 6, 30, 22, 0],
    },
    {
      id: '2026-07-01-mex-ecu',
      teamA: 'Mexico',
      teamB: 'Ecuador',
      kickoff: [2026, 7, 1, 2, 0],
    },
    {
      id: '2026-07-01-eng-drc',
      teamA: 'England',
      teamB: 'DR Congo',
      kickoff: [2026, 7, 1, 17, 0],
    },
    {
      id: '2026-07-01-bel-sen',
      teamA: 'Belgium',
      teamB: 'Senegal',
      kickoff: [2026, 7, 1, 21, 0],
    },
    {
      id: '2026-07-02-usa-bih',
      teamA: 'United States',
      teamB: 'Bosnia-Herzegovina',
      kickoff: [2026, 7, 2, 1, 0],
    },
    {
      id: '2026-07-02-esp-aut',
      teamA: 'Spain',
      teamB: 'Austria',
      kickoff: [2026, 7, 2, 20, 0],
    },
    {
      id: '2026-07-03-prt-hrv',
      teamA: 'Portugal',
      teamB: 'Croatia',
      kickoff: [2026, 7, 3, 0, 0],
    },
    {
      id: '2026-07-03-che-dza',
      teamA: 'Switzerland',
      teamB: 'Algeria',
      kickoff: [2026, 7, 3, 4, 0],
    },
    {
      id: '2026-07-03-aus-egy',
      teamA: 'Australia',
      teamB: 'Egypt',
      kickoff: [2026, 7, 3, 19, 0],
    },
    {
      id: '2026-07-03-arg-cpv',
      teamA: 'Argentina',
      teamB: 'Cape Verde',
      kickoff: [2026, 7, 3, 23, 0],
    },
    {
      id: '2026-07-04-col-gha',
      teamA: 'Colombia',
      teamB: 'Ghana',
      kickoff: [2026, 7, 4, 2, 30],
    },
    {
      id: '2026-07-04-can-mar',
      teamA: 'Canada',
      teamB: 'Morocco',
      kickoff: [2026, 7, 4, 18, 0],
    },
    {
      id: '2026-07-04-par-fra',
      teamA: 'Paraguay',
      teamB: 'France',
      kickoff: [2026, 7, 4, 22, 0],
    },
    {
      id: '2026-07-05-bra-nor',
      teamA: 'Brazil',
      teamB: 'Norway',
      kickoff: [2026, 7, 5, 21, 0],
    },
    {
      id: '2026-07-06-mex-eng',
      teamA: 'Mexico',
      teamB: 'England',
      kickoff: [2026, 7, 6, 1, 0],
    },
    {
      id: '2026-07-06-por-esp',
      teamA: 'Portugal',
      teamB: 'Spain',
      kickoff: [2026, 7, 6, 20, 0],
    },
    {
      id: '2026-07-07-usa-bel',
      teamA: 'USA',
      teamB: 'Belgium',
      kickoff: [2026, 7, 7, 1, 0],
    },
    {
      id: '2026-07-07-arg-egy',
      teamA: 'Argentina',
      teamB: 'Egypt',
      kickoff: [2026, 7, 7, 17, 0],
    },
    {
      id: '2026-07-07-sui-col',
      teamA: 'Switzerland',
      teamB: 'Colombia',
      kickoff: [2026, 7, 7, 21, 0],
    },
  ];

  console.log('\n--- Seeding matches (kickoffs in UK time) ---');

  for (const m of matches) {
    const [year, month, day, hour, minute] = m.kickoff;
    const start = ukKickoff(year, month, day, hour, minute);

    const end = new Date(start);
    end.setUTCHours(end.getUTCHours() + 2);

    const ref = db.collection('matches').doc(m.id);

    batch.set(
      ref,
      {
        teamA: m.teamA,
        teamB: m.teamB,
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
      },
      { merge: true },
    );

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
