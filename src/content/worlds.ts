// World registry — friendly "stages" the World Map reads. Each world holds an ordered list of
// mission ids. Like everything in content, the title is an i18n KEY, never prose.
export interface World {
  id: string;
  titleKey: string;
  missionIds: string[];
}

export const WORLDS: ReadonlyArray<World> = [
  {
    id: 'world-1',
    titleKey: 'world.world-1.title',
    missionIds: ['1-1-greet', '1-2-complaint', '1-3-concise', '1-4-persona']
  },
  {
    id: 'world-2',
    titleKey: 'world.world-2.title',
    missionIds: ['2-1-currency', '2-2-estimate', '2-3-contract', '2-4-news']
  },
  {
    id: 'world-3',
    titleKey: 'world.world-3.title',
    missionIds: ['3-1-name', '3-2-history', '3-3-faq', '3-4-honesty']
  },
  {
    id: 'world-4',
    titleKey: 'world.world-4.title',
    missionIds: ['4-1-report', '4-2-onboarding', '4-3-move', '4-4-mailout']
  },
  {
    id: 'world-5',
    titleKey: 'world.world-5.title',
    missionIds: ['5-1-press', '5-2-reports', '5-3-contract', '5-4-reply']
  },
  {
    id: 'world-6',
    titleKey: 'world.world-6.title',
    missionIds: ['6-1-mailcap', '6-2-search', '6-3-noreply', '6-4-cheap']
  },
  {
    id: 'world-7',
    titleKey: 'world.world-7.title',
    missionIds: ['7-1-transfer', '7-2-ignore', '7-3-address', '7-4-boss']
  }
];

export function worldById(id: string): World | undefined {
  return WORLDS.find((w) => w.id === id);
}

/** Mission ids that belong to a given world, in author order. */
export function missionIdsForWorld(worldId: string): string[] {
  return worldById(worldId)?.missionIds ?? [];
}
