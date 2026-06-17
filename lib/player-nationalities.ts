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

export interface CountryWithRank {
  name: string;
  rank: number;
}

export interface PlayerNationalityInfo {
  countries: [CountryWithRank, CountryWithRank];
  averageRank: number;
}

const PLAYER_NATIONALITIES: Record<string, [CountryWithRank, CountryWithRank]> = {
  James: [
    { name: 'Argentina', rank: 1 },
    { name: 'Bosnia and Herzegovina', rank: 63 },
  ],
  Reuben: [
    { name: 'France', rank: 3 },
    { name: 'South Africa', rank: 61 },
  ],
  Christopher: [
    { name: 'Brazil', rank: 6 },
    { name: 'Qatar', rank: 56 },
  ],
  Victoria: [
    { name: 'Spain', rank: 2 },
    { name: 'Cabo Verde', rank: 67 },
  ],
  Alice: [
    { name: 'England', rank: 4 },
    { name: 'Uzbekistan', rank: 50 },
  ],
  Bonnie: [
    { name: 'Germany', rank: 10 },
    { name: 'Panama', rank: 34 },
  ],
  Sean: [
    { name: 'Portugal', rank: 5 },
    { name: 'Sweden', rank: 38 },
  ],
  Suhail: [
    { name: 'Netherlands', rank: 8 },
    { name: 'Austria', rank: 25 },
  ],
  Troy: [
    { name: 'Belgium', rank: 9 },
    { name: 'Saudi Arabia', rank: 60 },
  ],
  Bella: [
    { name: 'Croatia', rank: 11 },
    { name: 'Scotland', rank: 41 },
  ],
  Nellie: [
    { name: 'Morocco', rank: 7 },
    { name: 'Czechia', rank: 43 },
  ],
  Sebastian: [
    { name: 'Uruguay', rank: 16 },
    { name: 'Algeria', rank: 28 },
  ],
  Nadia: [
    { name: 'Colombia', rank: 14 },
    { name: 'Tunisia', rank: 45 },
  ],
  Rainer: [
    { name: 'Switzerland', rank: 19 },
    { name: 'Ghana', rank: 73 },
  ],
  Ben: [
    { name: 'Mexico', rank: 13 },
    { name: 'Norway', rank: 30 },
  ],
  Ozie: [
    { name: 'United States', rank: 17 },
    { name: 'Türkiye', rank: 23 },
  ],
  Catarina: [
    { name: 'Japan', rank: 18 },
    { name: 'Egypt', rank: 29 },
  ],
  Tina: [
    { name: 'South Korea', rank: 22 },
    { name: 'Canada', rank: 31 },
  ],
  Bryan: [
    { name: 'Iran', rank: 20 },
    { name: 'Jordan', rank: 64 },
  ],
  Wanda: [
    { name: 'Senegal', rank: 15 },
    { name: 'Australia', rank: 27 },
  ],
  Winthur: [
    { name: 'Ecuador', rank: 24 },
    { name: 'New Zealand', rank: 85 },
  ],
  Samit: [
    { name: 'Paraguay', rank: 40 },
    { name: 'Iraq', rank: 57 },
  ],
  Jason: [
    { name: 'Côte d\'Ivoire', rank: 33 },
    { name: 'Congo DR', rank: 46 },
  ],
};

export function averageFifaRank(countries: [CountryWithRank, CountryWithRank]): number {
  return Math.round(((countries[0].rank + countries[1].rank) / 2) * 10) / 10;
}

export function formatCountryWithRank(country: CountryWithRank): string {
  return `${country.name} (#${country.rank})`;
}

export function getPlayerNationalityInfo(name: string): PlayerNationalityInfo | null {
  const countries = PLAYER_NATIONALITIES[name];
  if (!countries) return null;
  return {
    countries,
    averageRank: averageFifaRank(countries),
  };
}

/** @deprecated Use getPlayerNationalityInfo */
export function getPlayerNationalities(name: string): [string, string] | null {
  const info = getPlayerNationalityInfo(name);
  if (!info) return null;
  return [info.countries[0].name, info.countries[1].name];
}
