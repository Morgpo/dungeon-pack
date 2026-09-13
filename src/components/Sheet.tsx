import type { CSSProperties } from 'react';
import type { Character } from '../types';
import { backpackSlotIds, bodySlotIds } from '../rules';
import { Slot } from './Slot';

interface Props {
  character: Character;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onEdit?: (id: string) => void;
}

/** The dungeon-sheet layout: hands, body column, and the 6 backpack rooms. */
export function Sheet({ character, onDelete, onDuplicate, onEdit }: Props) {
  const bodyIds = bodySlotIds(character.strength);
  const mainHand = character.slots['mainHand'];

  return (
    <div className="sheet">
      <div className="sheet__hands">
        <Slot
          address="mainHand"
          label="Main Hand"
          variant="equipment"
          item={mainHand}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onEdit={onEdit}
        />
        <Slot
          address="offHand"
          label="Off Hand"
          variant="equipment"
          item={character.slots['offHand']}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onEdit={onEdit}
          coveredBy={mainHand?.twoHanded ? mainHand.name : undefined}
        />
      </div>

      <section className="sheet__body">
        <h2 className="sheet__section-title">Body</h2>
        <div
          className="sheet__body-slots"
          style={{ '--body-slots': bodyIds.length } as CSSProperties}
        >
          {bodyIds.map((id, i) => {
            const isStrength = id.startsWith('body-str');
            return (
              <Slot
                key={id}
                address={id}
                label={`Body ${i + 1}`}
                variant="equipment"
                badge={isStrength ? `STR +${id.split('-')[2]}` : undefined}
                item={character.slots[id]}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onEdit={onEdit}
              />
            );
          })}
        </div>
      </section>

      <section className="sheet__backpack">
        <h2 className="sheet__section-title">Backpack</h2>
        <div className="sheet__rooms">
          {backpackSlotIds().map((id, i) => (
            <Slot
              key={id}
              address={id}
              label={`Room ${i + 1}`}
              badge={`${i + 1}`}
              item={character.slots[id]}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onEdit={onEdit}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
