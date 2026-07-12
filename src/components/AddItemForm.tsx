import { useState } from 'react';
import type { ItemSize } from '../types';

interface Props {
  onAdd: (
    name: string,
    size: ItemSize,
    notes: string,
    twoHanded: boolean,
  ) => void;
}

export function AddItemForm({ onAdd }: Props) {
  const [name, setName] = useState('');
  const [size, setSize] = useState<ItemSize>('normal');
  const [notes, setNotes] = useState('');
  const [twoHanded, setTwoHanded] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, size, notes, twoHanded);
    setName('');
    setSize('normal');
    setNotes('');
    setTwoHanded(false);
  }

  return (
    <form className="add-form" onSubmit={submit}>
      <h2 className="add-form__title">Add item</h2>
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
          <select value={size} onChange={(e) => setSize(e.target.value as ItemSize)}>
            <option value="trivial">Trivial (pockets)</option>
            <option value="normal">Normal (backpack)</option>
            <option value="heavy">Heavy (body)</option>
          </select>
        </label>
      </div>
      <label className="add-form__checkbox">
        <input
          type="checkbox"
          checked={twoHanded}
          onChange={(e) => setTwoHanded(e.target.checked)}
        />
        <span>Two-handed (fills both hands)</span>
      </label>
      <label className="add-form__field">
        <span>Notes (optional)</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="+1, silvered…" />
      </label>
      <button type="submit" className="add-form__submit">
        Add to tray
      </button>
    </form>
  );
}
