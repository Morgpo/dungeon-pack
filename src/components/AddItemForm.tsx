import { useState } from 'react';
import type { Item, ItemSize } from '../types';

interface Props {
  onAdd: (
    name: string,
    size: ItemSize,
    notes: string,
    twoHanded: boolean,
  ) => void;
  /** When set, the form is prefilled to edit this item instead of adding a fresh one. */
  editingItem?: Item | null;
  onCancelEdit?: () => void;
}

export function AddItemForm({ onAdd, editingItem, onCancelEdit }: Props) {
  const [name, setName] = useState(editingItem?.name ?? '');
  const [size, setSize] = useState<ItemSize>(editingItem?.size ?? 'normal');
  const [notes, setNotes] = useState(editingItem?.notes ?? '');
  const [twoHanded, setTwoHanded] = useState(!!editingItem?.twoHanded);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, size, notes, size === 'heavy' && twoHanded);
    setName('');
    setSize('normal');
    setNotes('');
    setTwoHanded(false);
  }

  function changeSize(next: ItemSize) {
    setSize(next);
    if (next !== 'heavy') setTwoHanded(false);
  }

  return (
    <form className="add-form" onSubmit={submit}>
      <h2 className="add-form__title">{editingItem ? 'Edit item' : 'Add item'}</h2>
      <label className="add-form__field add-form__field--name">
        <span>Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rope, 50 ft"
          required
        />
      </label>
      <div className="add-form__row">
        <label className="add-form__field">
          <span>Size</span>
          <select value={size} onChange={(e) => changeSize(e.target.value as ItemSize)}>
            <option value="trivial">Trivial (pockets)</option>
            <option value="normal">Normal (backpack)</option>
            <option value="heavy">Heavy (body)</option>
          </select>
        </label>
      </div>
      {size === 'heavy' && (
        <label className="add-form__checkbox">
          <input
            type="checkbox"
            checked={twoHanded}
            onChange={(e) => setTwoHanded(e.target.checked)}
          />
          <span>Two-handed (fills both hands)</span>
        </label>
      )}
      <label className="add-form__field">
        <span>Notes (optional)</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="+1, silvered…" />
      </label>
      <div className="add-form__actions">
        <button type="submit" className="add-form__submit">
          {editingItem ? 'Save item' : 'Add to tray'}
        </button>
        {editingItem && (
          <button type="button" className="add-form__cancel" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
