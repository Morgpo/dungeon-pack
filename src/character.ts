import type { Character, Item, ItemSize } from './types';

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function createItem(
  name: string,
  size: ItemSize,
  notes?: string,
  twoHanded = false,
): Item {
  return {
    id: createId(),
    name: name.trim(),
    size,
    notes: notes?.trim() || undefined,
    twoHanded: twoHanded || undefined,
  };
}

export function createDefaultCharacter(): Character {
  return {
    id: createId(),
    name: 'New Adventurer',
    strength: 0,
    gold: 0,
    slots: {},
    pockets: [],
    tray: [
      createItem('Longsword', 'normal'),
      createItem('Greataxe', 'heavy', undefined, true),
      createItem('Torch', 'trivial'),
      createItem('Gold pieces', 'trivial'),
    ],
  };
}
