import { useDroppable } from '@dnd-kit/core';
import type { Item } from '../types';
import { ItemCard } from './ItemCard';

interface Props {
  address: string;
  label: string;
  item?: Item;
  onDelete: (id: string) => void;
  /** Optional small badge, e.g. the room number or "STR +1". */
  badge?: string;
  variant?: 'equipment' | 'room';
}

export function Slot({ address, label, item, onDelete, badge, variant = 'room' }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: address });

  return (
    <div
      ref={setNodeRef}
      className={`slot slot--${variant}${isOver ? ' slot--over' : ''}${
        item ? ' slot--filled' : ''
      }`}
    >
      <div className="slot__header">
        <span className="slot__label">{label}</span>
        {badge && <span className="slot__badge">{badge}</span>}
      </div>
      <div className="slot__body">
        {item ? (
          <ItemCard item={item} onDelete={onDelete} />
        ) : (
          <span className="slot__empty">empty</span>
        )}
      </div>
    </div>
  );
}
