/** Frozen FIFA rankings snapshot — June 2026 tournament start. Not fetched live. */
export const FIFA_RANKINGS_JUNE_2026: Record<string, number> = {
  Argentina: 1,
  Spain: 2,
  France: 3,
  England: 4,
  Portugal: 5,
  Brazil: 6,
  Morocco: 7,
  Netherlands: 8,
  Belgium: 9,
  Germany: 10,
  Croatia: 11,
  Mexico: 13,
  Colombia: 14,
  Senegal: 15,
  Uruguay: 16,
  USA: 17,
  Japan: 18,
  Switzerland: 19,
  Iran: 20,
  'South Korea': 22,
  Turkey: 23,
  Ecuador: 24,
  Austria: 25,
  Nigeria: 26,
  Australia: 27,
  Algeria: 28,
  Egypt: 29,
  Norway: 30,
  Canada: 31,
  'Ivory Coast': 33,
  Panama: 34,
  Sweden: 38,
  Paraguay: 40,
  Scotland: 41,
  Czechia: 43,
  Tunisia: 45,
  'DR Congo': 46,
  Uzbekistan: 50,
  Qatar: 56,
  Iraq: 57,
  'Saudi Arabia': 60,
  'South Africa': 61,
  'Bosnia and Herzegovina': 63,
  Jordan: 64,
  'Cabo Verde': 67,
  Ghana: 73,
  Curaçao: 82,
  Haiti: 83,
  'New Zealand': 85,
};

export function getFifaRank(country: string): number | null {
  return FIFA_RANKINGS_JUNE_2026[country] ?? null;
}

export function formatNationalityWithRank(nationality: string): string {
  const rank = getFifaRank(nationality);
  if (rank != null) return `${nationality} (#${rank})`;
  return nationality;
}
