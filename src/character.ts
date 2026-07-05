import type { Character, Item } from './types';

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function createItem(
  name: string,
  weight: number,
  quantity = 1,
  notes?: string,
): Item {
  return { id: createId(), name: name.trim(), weight, quantity, notes: notes?.trim() || undefined };
}

export function createDefaultCharacter(): Character {
  return {
    id: createId(),
    name: 'New Adventurer',
    strength: 0,
    slots: {},
    pockets: [],
    tray: [
      createItem('Longsword', 3),
      createItem('Torch', 1),
      createItem('Gold pieces', 0.02, 25),
    ],
  };
}
