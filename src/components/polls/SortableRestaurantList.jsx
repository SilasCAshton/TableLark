"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  closestCenter, DndContext, DragOverlay,
  PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { moveRestaurantInOrder } from "@/lib/polls/ranking";

function CardContents({ option, rank, handle }) {
  return (
    <>
      {handle}
      <span className="poll-option-card__details">
        <strong>{option.name}</strong>
        <span>{option.primaryTypeDisplayName ?? "Restaurant"}</span>
      </span>
      {rank ? (
        <span className={`poll-option-card__rank poll-option-card__rank--${rank}`} aria-label={`Rank ${rank}`}>
          #{rank}
        </span>
      ) : null}
    </>
  );
}

function Grip() {
  return (
    <svg width="20" height="24" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true">
      {[5, 12, 19].flatMap((y) => [6, 14].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" />))}
    </svg>
  );
}

function SortableCard({ option, rank, disabled, canChoose, onChoose }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: option.id, disabled,
  });
  return (
    <li
      ref={setNodeRef}
      className={`poll-option-card${isDragging ? " poll-option-card--placeholder" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {canChoose && !rank && !disabled ? (
        <button
          type="button"
          className="poll-option-card__choose"
          aria-label={`Choose ${option.name}`}
          onClick={() => onChoose(option.id)}
        />
      ) : null}
      <CardContents option={option} rank={rank} handle={
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="poll-drag-handle"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${option.name}`}
          title="Drag to reorder"
          tabIndex={-1}
          disabled={disabled}
        ><Grip /></button>
      } />
    </li>
  );
}

export default function SortableRestaurantList({ options, order, rankCount, disabled, onOrderChange, onDraggingChange, canChoose, onChoose }) {
  const id = useId();
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const byId = new Map(options.map((option) => [option.id, option]));
  const activeOption = byId.get(activeId);
  const rankOf = (optionId) => {
    const index = order.indexOf(optionId);
    return index >= 0 && index < rankCount ? index + 1 : null;
  };
  function finishDrag() {
    setActiveId(null);
    onDraggingChange(false);
  }
  const announcements = {
    onDragStart: ({ active }) => `Picked up ${byId.get(active.id)?.name}. Position ${order.indexOf(active.id) + 1} of ${order.length}.`,
    onDragOver: ({ active, over }) => over ? `${byId.get(active.id)?.name}, new position ${order.indexOf(over.id) + 1} of ${order.length}.` : "Outside the list.",
    onDragEnd: ({ active, over }) => over ? `Dropped ${byId.get(active.id)?.name} at position ${order.indexOf(over.id) + 1}.` : "Reordering canceled.",
    onDragCancel: () => "Reordering canceled. Original order restored.",
  };
  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements, screenReaderInstructions: { draggable: "Drag the handle to reorder this restaurant." } }}
      onDragStart={({ active }) => { setActiveId(active.id); onDraggingChange(true); }}
      onDragCancel={finishDrag}
      onDragEnd={({ active, over }) => {
        if (!disabled && over && active.id !== over.id) {
          onOrderChange(moveRestaurantInOrder(order, active.id, order.indexOf(over.id) - order.indexOf(active.id)));
        }
        finishDrag();
      }}
    >
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ol className="poll-option-list" aria-label="Restaurant order">
          {order.map((optionId) => <SortableCard key={optionId} option={byId.get(optionId)} rank={rankOf(optionId)} disabled={disabled} canChoose={canChoose} onChoose={onChoose} />)}
        </ol>
      </SortableContext>
      {typeof document !== "undefined" ? createPortal(
        <DragOverlay dropAnimation={null}>
          {activeOption ? (
            <div className="poll-option-card poll-option-card--dragging" aria-hidden="true">
              <CardContents option={activeOption} rank={rankOf(activeId)} handle={<span className="poll-drag-handle"><Grip /></span>} />
            </div>
          ) : null}
        </DragOverlay>, document.body,
      ) : null}
    </DndContext>
  );
}
