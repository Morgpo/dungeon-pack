import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { Character, ItemSize, Location } from './types';
import { deleteItem, moveItem } from './rules';
import { createDefaultCharacter, createItem } from './character';
import { useLocalStorage } from './useLocalStorage';
import { Sheet } from './components/Sheet';
import { ItemList } from './components/ItemList';
import { AddItemForm } from './components/AddItemForm';
import { Summary } from './components/Summary';
import { ItemCard } from './components/ItemCard';

const STORAGE_KEY = 'dungeon-pack.character.v2';

export default function App() {
  const [character, setCharacter] = useLocalStorage<Character>(
    STORAGE_KEY,
    createDefaultCharacter,
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // A small drag distance prevents clicks (like the delete ×) from starting drags.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeItem = activeId ? findItem(character, activeId) : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    setMessage(null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const to = String(over.id) as Location;
    const result = moveItem(character, String(active.id), to);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setCharacter(result.character);
  }

  function handleDelete(id: string) {
    setCharacter((c) => deleteItem(c, id));
  }

  function handleAdd(
    name: string,
    size: ItemSize,
    notes: string,
    twoHanded: boolean,
  ) {
    const item = createItem(name, size, notes, twoHanded);
    setCharacter((c) => ({ ...c, tray: [...c.tray, item] }));
  }

  function handleReset() {
    if (confirm('Reset this character? All items will be cleared.')) {
      setCharacter(createDefaultCharacter());
      setMessage(null);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="app">
        <header className="app__header">
          <h1 className="app__title">🗺️ Dungeon Pack</h1>
          <p className="app__tagline">Drag your gear into its slots.</p>
        </header>

        {message && (
          <div className="app__message" role="alert" onClick={() => setMessage(null)}>
            {message} <span className="app__message-dismiss">(dismiss)</span>
          </div>
        )}

        <div className="app__grid">
          <div className="app__main">
            <Sheet character={character} onDelete={handleDelete} />
            <ItemList
              id="pockets"
              title="Pockets"
              subtitle="trivial items only"
              items={character.pockets}
              onDelete={handleDelete}
              emptyHint="Drop coins, gems, and other light odds and ends here."
            />
          </div>

          <div className="app__side app__side--right">
            <Summary
              character={character}
              onNameChange={(name) => setCharacter((c) => ({ ...c, name }))}
              onStrengthChange={(strength) => setCharacter((c) => ({ ...c, strength }))}
              onReset={handleReset}
            />
          </div>

          <div className="app__side app__side--left">
            <AddItemForm onAdd={handleAdd} />
            <ItemList
              id="tray"
              title="Unassigned"
              subtitle="drag these into slots"
              items={character.tray}
              onDelete={handleDelete}
              emptyHint="Newly added items land here."
            />
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeItem ? <ItemCard item={activeItem} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function findItem(character: Character, id: string) {
  for (const item of Object.values(character.slots)) {
    if (item?.id === id) return item;
  }
  return (
    character.pockets.find((i) => i.id === id) ??
    character.tray.find((i) => i.id === id) ??
    null
  );
}
