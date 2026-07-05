# Dungeon Pack

A small, browser-only visualizer for a **homebrew D&D slot-based inventory**. Instead of tracking a
raw weight total, your gear lives in discrete slots laid out like rooms on a dungeon map. Drag items
between your hands, your body, your backpack, and your pockets and see at a glance what you're
carrying and where.

Everything runs client-side and saves to your browser's `localStorage` — no account, no server.

## The rules

| Zone | Capacity | Rule |
|---|---|---|
| **Main Hand** | 1 item | A held weapon/tool. Any weight. |
| **Off Hand** | 1 item | A held weapon/shield/tool. Any weight. |
| **Body** | 2 base slots | Worn/armor items. Any weight. |
| **Body (Strength)** | +1 / +2 / +3 slots | 3 extra body slots that unlock at Strength +1/+2/+3. |
| **Backpack (rooms 1–6)** | 6 slots, 1 item each | Always available. Each item **over 1 lb** takes one room. |
| **Pockets** | unlimited | Trivial items **1 lb or less** only. |

- **Strength** (a `+X` modifier) only unlocks the 3 extra Body slots. The backpack's 6 rooms are
  always available to everyone.
- Items **over 1 lb** are "slot" items (backpack rooms / equipment). Items **1 lb or less** are
  trivial and can go in Pockets.
- Dragging an item onto an occupied single-item slot **swaps** the two items.

The `1 lb` boundary and slot counts live as constants in [`src/rules.ts`](src/rules.ts) — easy to
retune for your table.

## Develop

```bash
npm install
npm run dev      # start the dev server
npm test         # run the rule unit tests
npm run build    # type-check + produce a static build in dist/
```

The production build in `dist/` is a static site — host it anywhere (GitHub Pages, Netlify, etc.).

## Stack

Vite + React 18 + TypeScript, [`@dnd-kit`](https://dndkit.com/) for drag-and-drop, Vitest for the
rule tests. No backend.
