import { FIFA_RANKINGS_JUNE_2026 } from './fifa-rankings';

/** All selectable World Cup nations, sorted alphabetically. */
export const WORLD_CUP_TEAMS = Object.keys(FIFA_RANKINGS_JUNE_2026).sort((a, b) =>
  a.localeCompare(b),
);

export function isValidWorldCupTeam(nationality: string): boolean {
  return nationality in FIFA_RANKINGS_JUNE_2026;
}
