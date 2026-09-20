'use client';
import { closestCenter, CollisionDetection, DndContext, DragEndEvent, PointerSensor, pointerWithin, TouchSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { Icon, P, TYPE_PATHS } from '@/lib/icons';
import type { Block } from '@/lib/types';

const collide: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : closestCenter(args);
};

function Row({ b }: { b: Block }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: b.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition, touchAction: 'none', zIndex: isDragging ? 5 : 1, position: 'relative', padding: '4px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 64, padding: '0 16px 0 8px', background: '#fff', borderRadius: 20, border: '1px solid var(--line)', boxShadow: isDragging ? '0 18px 40px rgba(0,0,0,0.18)' : 'none', transform: isDragging ? 'rotate(-2deg)' : 'none' }}>
        <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--chip)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDragging ? 'var(--sky-deep)' : 'var(--ink)' }}><Icon d={TYPE_PATHS[b.type]} size={19} /></span>
        <span style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><small style={{ fontSize: 12, color: 'var(--muted)' }}>{b.start_time ?? ''}{b.reservation ? ' · 예약' : ''}</small><b style={{ fontSize: 16 }}>{b.name}</b></span>
        <Icon d={P.grip} size={18} stroke={3} color="#9a9aa0" />
      </div>
    </div>
  );
}

function Trash() {
  const { setNodeRef, isOver } = useDroppable({ id: 'trash' });
  return (
    <div ref={setNodeRef} style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 16, width: 'calc(100% - 32px)', maxWidth: 448, height: 84, borderRadius: 24, background: isOver ? '#333' : 'var(--ink)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 15, fontWeight: 600, zIndex: 20 }}>
      <Icon d={P.trash} size={20} />여기에 놓으면 빼기
    </div>
  );
}

export default function EditList({ blocks, onReorder, onRemove, onDone }: { blocks: Block[]; onReorder: (ids: string[], moved: Block) => void; onRemove: (b: Block) => void; onDone: () => void }) {
  const [items, setItems] = useState(blocks);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }));
  const end = (e: DragEndEvent) => {
    const moved = items.find((b) => b.id === e.active.id);
    if (!moved || !e.over) return;
    if (e.over.id === 'trash') {
      setItems((xs) => xs.filter((x) => x.id !== moved.id));
      onRemove(moved);
      return;
    }
    if (e.over.id === e.active.id) return;
    const from = items.findIndex((b) => b.id === e.active.id);
    const to = items.findIndex((b) => b.id === e.over!.id);
    const next = arrayMove(items, from, to);
    setItems(next);
    onReorder(next.map((b) => b.id), moved);
  };
  return (
    <div style={{ paddingBottom: 140 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px 8px' }}>
        <button className="btn small" style={{ background: 'var(--sky-text)' }} onClick={onDone}>편집 끝</button>
      </div>
      <DndContext sensors={sensors} collisionDetection={collide} onDragEnd={end}>
        <SortableContext items={items.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {items.map((b) => <Row key={b.id} b={b} />)}
        </SortableContext>
        <Trash />
      </DndContext>
    </div>
  );
}
