import type { Character, Item, ItemSize, Location, SlotAddress, ZoneKind } from './types';

// ---- Tunable constants (retune for your table) ----------------------------

/** Body slots everyone has, before Strength. */
export const BASE_BODY_SLOTS = 2;
/** Extra Body slots unlockable via Strength (+1/+2/+3). */
export const MAX_STRENGTH_BODY_SLOTS = 3;
/** Backpack rooms — always available to everyone. */
export const BACKPACK_SLOTS = 6;

// ---- Small helpers --------------------------------------------------------

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** How many Body slots are available for the given Strength modifier. */
export function bodySlotCount(strength: number): number {
  return BASE_BODY_SLOTS + clamp(Math.floor(strength), 0, MAX_STRENGTH_BODY_SLOTS);
}

export function backpackSlotCount(): number {
  return BACKPACK_SLOTS;
}

/** Which zone kinds each size tier is allowed to occupy. */
export const SIZE_ZONES: Record<ItemSize, ZoneKind[]> = {
  trivial: ['pockets', 'tray'],
  normal: ['backpack', 'body', 'mainHand', 'offHand', 'tray'],
  heavy: ['body', 'mainHand', 'offHand', 'tray'],
};

export function isPocketEligible(item: Item): boolean {
  return item.size === 'trivial';
}

/** True for weapons that fill both hand slots at once. */
export function occupiesBothHands(item: Item): boolean {
  return !!item.twoHanded;
}

function isHandZone(zone: ZoneKind): boolean {
  return zone === 'mainHand' || zone === 'offHand';
}

// ---- Slot address generation ----------------------------------------------

export function backpackSlotIds(): SlotAddress[] {
  return Array.from({ length: BACKPACK_SLOTS }, (_, i) => `backpack-${i + 1}`);
}

/** Body slot addresses for a given Strength: 2 base + N strength-unlocked. */
export function bodySlotIds(strength: number): SlotAddress[] {
  const ids: SlotAddress[] = [];
  for (let i = 1; i <= BASE_BODY_SLOTS; i++) ids.push(`body-${i}`);
  const extra = clamp(Math.floor(strength), 0, MAX_STRENGTH_BODY_SLOTS);
  for (let i = 1; i <= extra; i++) ids.push(`body-str-${i}`);
  return ids;
}

/** Every single-item slot address that should currently be rendered. */
export function allSlotIds(strength: number): SlotAddress[] {
  return ['mainHand', 'offHand', ...bodySlotIds(strength), ...backpackSlotIds()];
}

// ---- Zone classification --------------------------------------------------

export function zoneOf(location: Location): ZoneKind {
  if (location === 'pockets') return 'pockets';
  if (location === 'tray') return 'tray';
  if (location === 'mainHand') return 'mainHand';
  if (location === 'offHand') return 'offHand';
  if (location.startsWith('body')) return 'body';
  if (location.startsWith('backpack')) return 'backpack';
  throw new Error(`Unknown location: ${location}`);
}

export function isListLocation(location: Location): location is 'pockets' | 'tray' {
  return location === 'pockets' || location === 'tray';
}

// ---- Placement validation -------------------------------------------------

export interface PlacementResult {
  ok: boolean;
  reason?: string;
}

/** Human-readable zone names for placement error messages. */
const ZONE_LABELS: Record<ZoneKind, string> = {
  mainHand: 'Main Hand',
  offHand: 'Off Hand',
  body: 'Body',
  backpack: 'Backpack',
  pockets: 'Pockets',
  tray: 'the tray',
};

/**
 * Whether `item` may be dropped into a location of the given zone kind, based on
 * its size tier (see `SIZE_ZONES`). Slot occupancy is handled separately by
 * swapping/displacing in `moveItem`.
 */
export function canPlace(item: Item, targetZone: ZoneKind): PlacementResult {
  if (SIZE_ZONES[item.size].includes(targetZone)) return { ok: true };
  return {
    ok: false,
    reason: `${item.name} is ${item.size} — can't go in ${ZONE_LABELS[targetZone]}.`,
  };
}

// ---- Read-only summaries --------------------------------------------------

export function usedBackpackSlots(character: Character): number {
  return backpackSlotIds().filter((id) => character.slots[id]).length;
}

export function usedBodySlots(character: Character): number {
  return bodySlotIds(character.strength).filter((id) => character.slots[id]).length;
}

// ---- Locating & moving items ----------------------------------------------

/** Find where an item currently lives, or undefined if it isn't placed. */
export function locationOf(character: Character, itemId: string): Location | undefined {
  for (const [addr, item] of Object.entries(character.slots)) {
    if (item?.id === itemId) return addr;
  }
  if (character.pockets.some((i) => i.id === itemId)) return 'pockets';
  if (character.tray.some((i) => i.id === itemId)) return 'tray';
  return undefined;
}

function itemAt(character: Character, location: Location): Item | undefined {
  if (location === 'pockets') return undefined; // resolved by id, not needed here
  if (location === 'tray') return undefined;
  return character.slots[location];
}

export interface MoveResult {
  character: Character;
  error?: string;
}

/**
 * Move an item to `to`, returning a new Character (pure — never mutates input).
 * Dropping onto an occupied single slot swaps: the displaced item goes back to
 * the source slot when the source was itself a single slot, otherwise to the tray.
 * Invalid moves (e.g. a heavy item into pockets) return the unchanged character
 * plus an `error` message.
 */
export function moveItem(character: Character, itemId: string, to: Location): MoveResult {
  const from = locationOf(character, itemId);
  if (!from) return { character, error: 'Item not found.' };

  const item = findItem(character, itemId);
  if (!item) return { character, error: 'Item not found.' };

  const check = canPlace(item, zoneOf(to));
  if (!check.ok) return { character, error: check.reason };

  // Work on a shallow-but-safe clone.
  const next: Character = {
    ...character,
    slots: { ...character.slots },
    pockets: [...character.pockets],
    tray: [...character.tray],
  };

  // 1. Remove the item from its source.
  removeFrom(next, from, itemId);

  // 2. Place it at the destination.
  if (isListLocation(to)) {
    next[to] = [...next[to], item];
  } else if (isHandZone(zoneOf(to)) && occupiesBothHands(item)) {
    // A two-handed weapon always lives at mainHand and covers offHand. Bump any
    // prior occupants of either hand to the tray (predictable over clever).
    for (const hand of ['mainHand', 'offHand'] as const) {
      const occupant = next.slots[hand];
      if (occupant && occupant.id !== itemId) next.tray = [...next.tray, occupant];
    }
    next.slots.mainHand = item;
    next.slots.offHand = undefined;
  } else {
    // A one-handed item going into a hand while a two-hander covers both hands
    // must first evict that two-hander to the tray.
    if (isHandZone(zoneOf(to))) {
      const twoHander = next.slots.mainHand;
      if (twoHander && occupiesBothHands(twoHander) && twoHander.id !== itemId) {
        next.tray = [...next.tray, twoHander];
        next.slots.mainHand = undefined;
      }
    }
    const occupant = itemAt(next, to);
    next.slots[to] = item;
    if (occupant && occupant.id !== itemId) {
      // Something was already there — relocate it.
      if (!isListLocation(from) && from !== to) {
        next.slots[from] = occupant; // straight swap between two slots
      } else {
        next.tray = [...next.tray, occupant]; // bump displaced item to the tray
      }
    }
  }

  return { character: next };
}

function findItem(character: Character, itemId: string): Item | undefined {
  for (const item of Object.values(character.slots)) {
    if (item?.id === itemId) return item;
  }
  return (
    character.pockets.find((i) => i.id === itemId) ??
    character.tray.find((i) => i.id === itemId)
  );
}

function removeFrom(character: Character, location: Location, itemId: string): void {
  if (location === 'pockets') {
    character.pockets = character.pockets.filter((i) => i.id !== itemId);
  } else if (location === 'tray') {
    character.tray = character.tray.filter((i) => i.id !== itemId);
  } else if (character.slots[location]?.id === itemId) {
    character.slots[location] = undefined;
  }
}

/** Remove an item entirely from the character (used when deleting). */
export function deleteItem(character: Character, itemId: string): Character {
  const from = locationOf(character, itemId);
  if (!from) return character;
  const next: Character = {
    ...character,
    slots: { ...character.slots },
    pockets: [...character.pockets],
    tray: [...character.tray],
  };
  removeFrom(next, from, itemId);
  return next;
}
