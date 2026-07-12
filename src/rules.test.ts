import { describe, it, expect } from 'vitest';
import type { Character, Item, ItemSize } from './types';
import {
  bodySlotCount,
  bodySlotIds,
  backpackSlotCount,
  isPocketEligible,
  canPlace,
  moveItem,
  deleteItem,
  locationOf,
  usedBackpackSlots,
} from './rules';

function item(over: Partial<Item> & { id: string; name: string }): Item {
  return { size: 'normal', ...over };
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

describe('size classification', () => {
  it('treats only trivial items as pocket-eligible', () => {
    expect(isPocketEligible(item({ id: 'a', name: 'coin', size: 'trivial' }))).toBe(true);
    expect(isPocketEligible(item({ id: 'b', name: 'sword', size: 'normal' }))).toBe(false);
    expect(isPocketEligible(item({ id: 'c', name: 'anvil', size: 'heavy' }))).toBe(false);
  });
});

describe('canPlace', () => {
  const bySize = (size: ItemSize) => item({ id: 'x', name: 'thing', size });

  it('lets trivial items go only in pockets (and tray)', () => {
    expect(canPlace(bySize('trivial'), 'pockets').ok).toBe(true);
    expect(canPlace(bySize('trivial'), 'tray').ok).toBe(true);
    expect(canPlace(bySize('trivial'), 'backpack').ok).toBe(false);
    expect(canPlace(bySize('trivial'), 'body').ok).toBe(false);
    expect(canPlace(bySize('trivial'), 'mainHand').ok).toBe(false);
  });

  it('lets normal items go in backpack, body, and hands but not pockets', () => {
    expect(canPlace(bySize('normal'), 'backpack').ok).toBe(true);
    expect(canPlace(bySize('normal'), 'body').ok).toBe(true);
    expect(canPlace(bySize('normal'), 'mainHand').ok).toBe(true);
    expect(canPlace(bySize('normal'), 'offHand').ok).toBe(true);
    expect(canPlace(bySize('normal'), 'pockets').ok).toBe(false);
  });

  it('lets heavy items go in body and hands but not backpack or pockets', () => {
    expect(canPlace(bySize('heavy'), 'body').ok).toBe(true);
    expect(canPlace(bySize('heavy'), 'mainHand').ok).toBe(true);
    expect(canPlace(bySize('heavy'), 'backpack').ok).toBe(false);
    expect(canPlace(bySize('heavy'), 'pockets').ok).toBe(false);
  });

  it('explains why a placement is rejected', () => {
    const res = canPlace(bySize('heavy'), 'backpack');
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/heavy/i);
  });
});

describe('moveItem', () => {
  it('moves an item from the tray into a backpack room', () => {
    const sword = item({ id: 'c', name: 'sword', size: 'normal' });
    const start: Character = { ...emptyCharacter(), tray: [sword] };
    const { character, error } = moveItem(start, 'c', 'backpack-1');
    expect(error).toBeUndefined();
    expect(character.slots['backpack-1']).toEqual(sword);
    expect(character.tray).toHaveLength(0);
    expect(locationOf(character, 'c')).toBe('backpack-1');
  });

  it('does not mutate the input character', () => {
    const sword = item({ id: 'c', name: 'sword', size: 'normal' });
    const start: Character = { ...emptyCharacter(), tray: [sword] };
    moveItem(start, 'c', 'backpack-1');
    expect(start.tray).toHaveLength(1);
    expect(start.slots['backpack-1']).toBeUndefined();
  });

  it('rejects dropping a heavy item into the backpack, unchanged', () => {
    const anvil = item({ id: 'c', name: 'anvil', size: 'heavy' });
    const start: Character = { ...emptyCharacter(), tray: [anvil] };
    const { character, error } = moveItem(start, 'c', 'backpack-1');
    expect(error).toMatch(/heavy/i);
    expect(character).toBe(start);
  });

  it('rejects dropping a normal item into pockets, unchanged', () => {
    const sword = item({ id: 'c', name: 'sword', size: 'normal' });
    const start: Character = { ...emptyCharacter(), tray: [sword] };
    const { character, error } = moveItem(start, 'c', 'pockets');
    expect(error).toMatch(/normal/i);
    expect(character).toBe(start);
  });

  it('swaps two items when both are in single slots', () => {
    const sword = item({ id: 'c', name: 'sword', size: 'normal' });
    const axe = item({ id: 'd', name: 'axe', size: 'normal' });
    const start: Character = {
      ...emptyCharacter(),
      slots: { 'backpack-1': sword, mainHand: axe },
    };
    const { character } = moveItem(start, 'd', 'backpack-1'); // move axe onto the sword
    expect(character.slots['backpack-1']).toEqual(axe);
    expect(character.slots['mainHand']).toEqual(sword); // swapped back
  });

  it('bumps a displaced item to the tray when the source is a list', () => {
    const sword = item({ id: 'c', name: 'sword', size: 'normal' });
    const dagger = item({ id: 'a', name: 'dagger', size: 'normal' });
    const start: Character = {
      ...emptyCharacter(),
      slots: { 'backpack-1': sword },
      tray: [dagger],
    };
    // Drag the dagger from the tray onto the occupied backpack room.
    const { character } = moveItem(start, 'a', 'backpack-1');
    expect(character.slots['backpack-1']).toEqual(dagger);
    expect(character.tray).toContainEqual(sword); // displaced sword bumped to tray
  });
});

describe('two-handed weapons', () => {
  it('fills both hands and bumps prior hand occupants to the tray', () => {
    const greataxe = item({ id: 'g', name: 'greataxe', size: 'heavy', twoHanded: true });
    const shield = item({ id: 's', name: 'shield', size: 'normal' });
    const start: Character = {
      ...emptyCharacter(),
      slots: { offHand: shield },
      tray: [greataxe],
    };
    const { character, error } = moveItem(start, 'g', 'mainHand');
    expect(error).toBeUndefined();
    expect(character.slots['mainHand']).toEqual(greataxe);
    expect(character.slots['offHand']).toBeUndefined(); // covered, not a real occupant
    expect(character.tray).toContainEqual(shield); // displaced to tray
  });

  it('stores a two-hander at mainHand even when dropped on the off hand', () => {
    const greataxe = item({ id: 'g', name: 'greataxe', size: 'heavy', twoHanded: true });
    const start: Character = { ...emptyCharacter(), tray: [greataxe] };
    const { character } = moveItem(start, 'g', 'offHand');
    expect(character.slots['mainHand']).toEqual(greataxe);
    expect(character.slots['offHand']).toBeUndefined();
  });

  it('evicts a two-hander when a one-hander takes the off hand', () => {
    const greataxe = item({ id: 'g', name: 'greataxe', size: 'heavy', twoHanded: true });
    const shield = item({ id: 's', name: 'shield', size: 'normal' });
    const start: Character = {
      ...emptyCharacter(),
      slots: { mainHand: greataxe },
      tray: [shield],
    };
    const { character } = moveItem(start, 's', 'offHand');
    expect(character.slots['offHand']).toEqual(shield);
    expect(character.slots['mainHand']).toBeUndefined();
    expect(character.tray).toContainEqual(greataxe); // two-hander bumped to tray
  });
});

describe('deleteItem', () => {
  it('removes an item wherever it lives', () => {
    const coin = item({ id: 'a', name: 'coin', size: 'trivial' });
    const start: Character = { ...emptyCharacter(), pockets: [coin] };
    const after = deleteItem(start, 'a');
    expect(after.pockets).toHaveLength(0);
    expect(locationOf(after, 'a')).toBeUndefined();
  });
});

describe('summaries', () => {
  it('counts used backpack slots', () => {
    const sword = item({ id: 'c', name: 'sword', size: 'normal' });
    const character: Character = {
      ...emptyCharacter(),
      slots: { 'backpack-1': sword },
    };
    expect(usedBackpackSlots(character)).toBe(1);
  });
});
