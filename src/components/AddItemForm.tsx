import { useState } from 'react';

interface Props {
  onAdd: (name: string, weight: number, quantity: number, notes: string) => void;
}

export function AddItemForm({ onAdd }: Props) {
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('1');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const w = Number(weight);
    const q = Math.max(1, Math.floor(Number(quantity) || 1));
    if (!name.trim() || Number.isNaN(w) || w < 0) return;
    onAdd(name, w, q, notes);
    setName('');
    setWeight('1');
    setQuantity('1');
    setNotes('');
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
          <span>Weight (lb)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </label>
        <label className="add-form__field">
          <span>Qty</span>
          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
      </div>
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
