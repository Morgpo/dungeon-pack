import { useDroppable } from '@dnd-kit/core';
import type { Item } from '../types';
import { ItemCard } from './ItemCard';

interface Props {
  address: string;
  label: string;
  item?: Item;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onEdit?: (id: string) => void;
  /** Optional small badge, e.g. the room number or "STR +1". */
  badge?: string;
  variant?: 'equipment' | 'room';
  /** Name of a two-handed item in the other hand that also covers this slot. */
  coveredBy?: string;
}

export function Slot({
  address,
  label,
  item,
  onDelete,
  onDuplicate,
  onEdit,
  badge,
  variant = 'room',
  coveredBy,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: address });
  const covered = !item && !!coveredBy;

  return (
    <div
      ref={setNodeRef}
      className={`slot slot--${variant}${isOver ? ' slot--over' : ''}${
        item ? ' slot--filled' : ''
      }${covered ? ' slot--covered' : ''}`}
    >
      <div className="slot__header">
        <span className="slot__label">{label}</span>
        {badge && <span className="slot__badge">{badge}</span>}
      </div>
      <div className="slot__body">
        {item ? (
          <ItemCard item={item} onDelete={onDelete} onDuplicate={onDuplicate} onEdit={onEdit} />
        ) : covered ? (
          <span className="slot__covered">⟵ {coveredBy} (both hands)</span>
        ) : (
          <span className="slot__empty">empty</span>
        )}
      </div>
    </div>
  );
}
