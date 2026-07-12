import { useDroppable } from '@dnd-kit/core';
import type { Item } from '../types';
import { ItemCard } from './ItemCard';

interface Props {
  id: 'pockets' | 'tray';
  title: string;
  subtitle?: string;
  items: Item[];
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onEdit?: (id: string) => void;
  emptyHint: string;
}

/** A droppable list location (Pockets or the unassigned Tray). */
export function ItemList({
  id,
  title,
  subtitle,
  items,
  onDelete,
  onDuplicate,
  onEdit,
  emptyHint,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section className={`item-list item-list--${id}${isOver ? ' item-list--over' : ''}`}>
      <header className="item-list__header">
        <h2 className="item-list__title">{title}</h2>
        {subtitle && <span className="item-list__subtitle">{subtitle}</span>}
      </header>
      <div ref={setNodeRef} className="item-list__drop">
        {items.length === 0 ? (
          <p className="item-list__empty">{emptyHint}</p>
        ) : (
          <div className="item-list__items">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
