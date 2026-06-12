const PLAYER_NATIONALITIES: Record<string, [string, string]> = {
  James: ['Argentina', 'Bosnia and Herzegovina'],
  Wanda: ['France', 'South Africa'],
  Eric: ['Brazil', 'Qatar'],
  Lucy: ['Spain', 'Cabo Verde'],
  Alice: ['England', 'Uzbekistan'],
  Bonnie: ['Germany', 'Panama'],
  Sean: ['Portugal', 'Sweden'],
  Suhail: ['Netherlands', 'Austria'],
  Troy: ['Belgium', 'Saudi Arabia'],
  Bella: ['Croatia', 'Scotland'],
  Nellie: ['Morocco', 'Czechia'],
  Sherry: ['Uruguay', 'Algeria'],
  Nadia: ['Colombia', 'Tunisia'],
  Rainer: ['Switzerland', 'Ghana'],
  Ben: ['Mexico', 'Norway'],
  Ozie: ['United States', 'Türkiye'],
  Rufina: ['Japan', 'Egypt'],
  Tina: ['South Korea', 'Canada'],
  Bryan: ['Iran', 'Jordan'],
  Gabriel: ['Senegal', 'Australia'],
  Winthur: ['Ecuador', 'New Zealand'],
  Samit: ['Paraguay', 'Iraq'],
  Jason: ['Côte d\'Ivoire', 'Congo DR'],
};

export function getPlayerNationalities(name: string): [string, string] | null {
  return PLAYER_NATIONALITIES[name] ?? null;
}
