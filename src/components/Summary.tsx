import type { Character } from '../types';
import {
  bodySlotCount,
  BASE_BODY_SLOTS,
  MAX_STRENGTH_BODY_SLOTS,
  backpackSlotCount,
  clamp,
  usedBackpackSlots,
  usedBodySlots,
} from '../rules';

interface Props {
  character: Character;
  onNameChange: (name: string) => void;
  onStrengthChange: (strength: number) => void;
  onGoldChange: (gold: number) => void;
  onReset: () => void;
}

export function Summary({
  character,
  onNameChange,
  onStrengthChange,
  onGoldChange,
  onReset,
}: Props) {
  const strengthUnlocked = clamp(Math.floor(character.strength), 0, MAX_STRENGTH_BODY_SLOTS);

  return (
    <aside className="summary">
      <h2 className="summary__title">Character</h2>
      <label className="summary__field">
        <span>Name</span>
        <input
          className="summary__name"
          value={character.name}
          onChange={(e) => onNameChange(e.target.value)}
          aria-label="Character name"
        />
      </label>

      <label className="summary__field">
        <span>Strength modifier</span>
        <input
          type="number"
          className="summary__strength"
          value={character.strength}
          onChange={(e) => onStrengthChange(Number(e.target.value) || 0)}
          aria-label="Strength modifier"
        />
      </label>

      <label className="summary__field">
        <span>Total gold</span>
        <input
          type="number"
          min="0"
          className="summary__gold"
          value={character.gold ?? 0}
          onChange={(e) => onGoldChange(Number(e.target.value) || 0)}
          aria-label="Total gold"
        />
      </label>

      <dl className="summary__stats">
        <div>
          <dt>Body slots</dt>
          <dd>
            {usedBodySlots(character)}/{bodySlotCount(character.strength)}
            <small>
              {' '}
              ({BASE_BODY_SLOTS} base
              {strengthUnlocked > 0 ? ` + ${strengthUnlocked} STR` : ''})
            </small>
          </dd>
        </div>
        <div>
          <dt>Backpack rooms</dt>
          <dd>
            {usedBackpackSlots(character)}/{backpackSlotCount()}
          </dd>
        </div>
      </dl>

      <button type="button" className="summary__reset" onClick={onReset}>
        Reset character
      </button>
    </aside>
  );
}
