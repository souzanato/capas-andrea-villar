"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TextBlock } from "@/lib/editor/layout-schema";

interface LayersPanelProps {
  blocks: TextBlock[];
  selectedBlockId: string | null;
  onSelect: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function LayersPanel({
  blocks,
  selectedBlockId,
  onSelect,
  onToggleHidden,
  onRename,
  onReorder,
  onDuplicate,
  onDelete,
}: LayersPanelProps) {
  // Ordena por zIndex decrescente (maior zIndex no topo)
  const sorted = [...blocks].sort((a, b) => b.zIndex - a.zIndex);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sorted.findIndex((b) => b.id === active.id);
      const newIndex = sorted.findIndex((b) => b.id === over.id);
      const reordered = [...sorted];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      onReorder(reordered.map((b) => b.id));
    },
    [sorted, onReorder]
  );

  if (blocks.length === 0) {
    return (
      <div className="p-3 text-center text-xs text-muted-foreground">
        Nenhuma camada
      </div>
    );
  }

  return (
    <DndContext
      id="layers-dnd-context"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sorted.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="divide-y divide-border/50">
          {sorted.map((block) => (
            <SortableLayerItem
              key={block.id}
              block={block}
              isSelected={block.id === selectedBlockId}
              onSelect={() => onSelect(block.id)}
              onToggleHidden={() => onToggleHidden(block.id)}
              onRename={(name) => onRename(block.id, name)}
              onDuplicate={() => onDuplicate(block.id)}
              onDelete={() => onDelete(block.id)}
              canDelete={blocks.length > 1}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface SortableLayerItemProps {
  block: TextBlock;
  isSelected: boolean;
  onSelect: () => void;
  onToggleHidden: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

function SortableLayerItem({
  block,
  isSelected,
  onSelect,
  onToggleHidden,
  onRename,
  onDuplicate,
  onDelete,
  canDelete,
}: SortableLayerItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(block.name ?? "");
  const [isHovered, setIsHovered] = useState(false);

  const label = block.name || block.lines[0]?.text || "Sem texto";

  const handleDoubleClick = () => {
    setEditValue(block.name ?? label);
    setIsEditing(true);
  };

  const handleRenameSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== block.name) {
      onRename(trimmed);
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 px-2 py-1.5 text-xs cursor-pointer transition-colors",
        isDragging && "opacity-50",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-muted/50 text-foreground"
      )}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0"
        {...attributes}
        {...listeners}
        tabIndex={-1}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Eye toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleHidden();
        }}
        className={cn(
          "flex-shrink-0",
          block.hidden
            ? "text-muted-foreground/50 hover:text-muted-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        title={block.hidden ? "Mostrar" : "Ocultar"}
      >
        {block.hidden ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Label or rename input */}
      <div className="flex-1 min-w-0 truncate">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
              if (e.key === "Escape") setIsEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-background border border-border rounded px-1 py-0.5 text-[11px] font-mono outline-none"
            autoFocus
          />
        ) : (
          <span
            className={cn(
              "block truncate",
              block.hidden && "text-muted-foreground/50 italic"
            )}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleDoubleClick();
            }}
          >
            {label}
          </span>
        )}
      </div>

      {/* Hover actions: Duplicate + Delete */}
      {isHovered && !isEditing && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="text-muted-foreground hover:text-foreground p-0.5"
            title="Duplicar"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (canDelete) onDelete();
            }}
            disabled={!canDelete}
            className={cn(
              "p-0.5",
              canDelete
                ? "text-muted-foreground hover:text-destructive"
                : "text-muted-foreground/30 cursor-not-allowed"
            )}
            title={canDelete ? "Deletar" : "Última camada"}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
