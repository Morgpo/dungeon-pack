export interface Item {
  id: string;
  name: string;
  weight: number; // in pounds
  quantity: number;
  notes?: string;
}

/**
 * A single-item slot address, e.g. 'mainHand', 'offHand', 'body-1', 'body-str-2',
 * 'backpack-4'. Pockets and the unassigned tray are list locations, not single slots.
 */
export type SlotAddress = string;

/** Any place an item can live. Single-slot addresses, or the two list locations. */
export type Location = SlotAddress | 'pockets' | 'tray';

/** The logical kind of a location, used for placement rules. */
export type ZoneKind =
  | 'mainHand'
  | 'offHand'
  | 'body'
  | 'backpack'
  | 'pockets'
  | 'tray';

export interface Character {
  id: string;
  name: string;
  /** Strength modifier ("+X"); only unlocks extra Body slots. */
  strength: number;
  /** Single-item slots keyed by address. Missing/undefined means empty. */
  slots: Record<SlotAddress, Item | undefined>;
  /** Trivial items (<= 1 lb). Unlimited. */
  pockets: Item[];
  /** Newly added / unassigned items waiting to be placed. */
  tray: Item[];
}
