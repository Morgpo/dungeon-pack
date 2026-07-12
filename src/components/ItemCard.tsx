import { useDraggable } from '@dnd-kit/core';
import type { Item } from '../types';

interface Props {
  item: Item;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  /** When true, render a static (non-draggable) copy for the drag overlay. */
  overlay?: boolean;
}

export function ItemCard({ item, onDelete, onDuplicate, overlay = false }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    disabled: overlay,
  });

  const trivial = item.size === 'trivial';

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      className={`item-card${isDragging ? ' item-card--dragging' : ''}${
        overlay ? ' item-card--overlay' : ''
      }`}
      {...(overlay ? {} : listeners)}
      {...(overlay ? {} : attributes)}
    >
      <div className="item-card__main">
        <span className="item-card__name">{item.name}</span>
      </div>
      <div className="item-card__meta">
        <span className={`item-card__weight${trivial ? ' item-card__weight--trivial' : ''}`}>
          {item.size}{item.twoHanded ? ' · 2H' : ''}
        </span>
        {item.notes && <span className="item-card__notes" title={item.notes}>{item.notes}</span>}
      </div>
      {onDuplicate && !overlay && (
        <button
          type="button"
          className="item-card__duplicate"
          aria-label={`Duplicate ${item.name}`}
          title="Copy to Unassigned"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(item.id);
          }}
        >
          ⧉
        </button>
      )}
      {onDelete && !overlay && (
        <button
          type="button"
          className="item-card__delete"
          aria-label={`Delete ${item.name}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
