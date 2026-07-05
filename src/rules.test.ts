import { describe, it, expect } from 'vitest';
import type { Character, Item } from './types';
import {
  bodySlotCount,
  bodySlotIds,
  backpackSlotCount,
  isPocketEligible,
  isSlotItem,
  canPlace,
  moveItem,
  deleteItem,
  locationOf,
  totalWeight,
  usedBackpackSlots,
} from './rules';

function item(over: Partial<Item> & { id: string; name: string; weight: number }): Item {
  return { quantity: 1, ...over };
}

function emptyCharacter(strength = 0): Character {
  return { id: 'c1', name: 'Test', strength, slots: {}, pockets: [], tray: [] };
}

describe('bodySlotCount', () => {
  it('gives 2 base slots at Strength 0 or negative', () => {
    expect(bodySlotCount(0)).toBe(2);
    expect(bodySlotCount(-3)).toBe(2);
  });

  it('unlocks one extra slot per point up to +3', () => {
    expect(bodySlotCount(1)).toBe(3);
    expect(bodySlotCount(2)).toBe(4);
    expect(bodySlotCount(3)).toBe(5);
  });

  it('caps at 5 (2 base + 3 strength)', () => {
    expect(bodySlotCount(4)).toBe(5);
    expect(bodySlotCount(99)).toBe(5);
  });
});

describe('bodySlotIds', () => {
  it('lists exactly the unlocked slots', () => {
    expect(bodySlotIds(0)).toEqual(['body-1', 'body-2']);
    expect(bodySlotIds(2)).toEqual(['body-1', 'body-2', 'body-str-1', 'body-str-2']);
  });
});

describe('backpack', () => {
  it('always has 6 rooms', () => {
    expect(backpackSlotCount()).toBe(6);
  });
});

describe('weight classification', () => {
  it('treats <= 1 lb as pocket-eligible / trivial', () => {
    expect(isPocketEligible(item({ id: 'a', name: 'coin', weight: 0.1 }))).toBe(true);
    expect(isPocketEligible(item({ id: 'b', name: 'flask', weight: 1 }))).toBe(true);
    expect(isSlotItem(item({ id: 'b', name: 'flask', weight: 1 }))).toBe(false);
  });

  it('treats > 1 lb as a slot item', () => {
    expect(isSlotItem(item({ id: 'c', name: 'sword', weight: 3 }))).toBe(true);
    expect(isPocketEligible(item({ id: 'c', name: 'sword', weight: 3 }))).toBe(false);
  });
});

describe('canPlace', () => {
  it('rejects a heavy item in pockets', () => {
    const res = canPlace(item({ id: 'c', name: 'sword', weight: 3 }), 'pockets');
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/too heavy/i);
  });

  it('allows a trivial item in pockets', () => {
    expect(canPlace(item({ id: 'a', name: 'coin', weight: 0.1 }), 'pockets').ok).toBe(true);
  });

  it('allows any item in backpack / equipment', () => {
    const sword = item({ id: 'c', name: 'sword', weight: 3 });
    expect(canPlace(sword, 'backpack').ok).toBe(true);
    expect(canPlace(sword, 'mainHand').ok).toBe(true);
    expect(canPlace(sword, 'body').ok).toBe(true);
  });
});

describe('moveItem', () => {
  it('moves an item from the tray into a backpack room', () => {
    const sword = item({ id: 'c', name: 'sword', weight: 3 });
    const start: Character = { ...emptyCharacter(), tray: [sword] };
    const { character, error } = moveItem(start, 'c', 'backpack-1');
    expect(error).toBeUndefined();
    expect(character.slots['backpack-1']).toEqual(sword);
    expect(character.tray).toHaveLength(0);
    expect(locationOf(character, 'c')).toBe('backpack-1');
  });

  it('does not mutate the input character', () => {
    const sword = item({ id: 'c', name: 'sword', weight: 3 });
    const start: Character = { ...emptyCharacter(), tray: [sword] };
    moveItem(start, 'c', 'backpack-1');
    expect(start.tray).toHaveLength(1);
    expect(start.slots['backpack-1']).toBeUndefined();
  });

  it('rejects dropping a heavy item into pockets, unchanged', () => {
    const sword = item({ id: 'c', name: 'sword', weight: 3 });
    const start: Character = { ...emptyCharacter(), tray: [sword] };
    const { character, error } = moveItem(start, 'c', 'pockets');
    expect(error).toMatch(/too heavy/i);
    expect(character).toBe(start);
  });

  it('swaps two items when both are in single slots', () => {
    const sword = item({ id: 'c', name: 'sword', weight: 3 });
    const axe = item({ id: 'd', name: 'axe', weight: 4 });
    const start: Character = {
      ...emptyCharacter(),
      slots: { 'backpack-1': sword, mainHand: axe },
    };
    const { character } = moveItem(start, 'd', 'backpack-1'); // move axe onto the sword
    expect(character.slots['backpack-1']).toEqual(axe);
    expect(character.slots['mainHand']).toEqual(sword); // swapped back
  });

  it('bumps a displaced item to the tray when the source is a list', () => {
    const sword = item({ id: 'c', name: 'sword', weight: 3 });
    const coin = item({ id: 'a', name: 'coin', weight: 0.1 });
    const start: Character = {
      ...emptyCharacter(),
      slots: { 'backpack-1': sword },
      pockets: [coin],
    };
    // Drag the (light) coin from pockets onto the occupied backpack room.
    const { character } = moveItem(start, 'a', 'backpack-1');
    expect(character.slots['backpack-1']).toEqual(coin);
    expect(character.pockets).toHaveLength(0);
    expect(character.tray).toContainEqual(sword); // heavy sword bumped to tray, stays valid
  });
});

describe('deleteItem', () => {
  it('removes an item wherever it lives', () => {
    const coin = item({ id: 'a', name: 'coin', weight: 0.1 });
    const start: Character = { ...emptyCharacter(), pockets: [coin] };
    const after = deleteItem(start, 'a');
    expect(after.pockets).toHaveLength(0);
    expect(locationOf(after, 'a')).toBeUndefined();
  });
});

describe('summaries', () => {
  it('counts used backpack slots and total weight', () => {
    const sword = item({ id: 'c', name: 'sword', weight: 3, quantity: 1 });
    const coins = item({ id: 'a', name: 'coins', weight: 0.02, quantity: 50 });
    const character: Character = {
      ...emptyCharacter(),
      slots: { 'backpack-1': sword },
      pockets: [coins],
    };
    expect(usedBackpackSlots(character)).toBe(1);
    expect(totalWeight(character)).toBeCloseTo(3 + 0.02 * 50);
  });
});
