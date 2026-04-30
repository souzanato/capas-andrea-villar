"use client";

import { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import dynamic from "next/dynamic";
import { migrateLayout } from "@/lib/editor/migrate-layout";
import { useHistory } from "@/hooks/useHistory";
import { useSaveLayout } from "@/hooks/useSaveLayout";
import type { SaveStatus } from "@/hooks/useSaveLayout";
import LayersPanel from "./LayersPanel";
import ToolsPanel from "./ToolsPanel";
import type { CoverLayout, TextBlock } from "@/lib/editor/layout-schema";
import type Konva from "konva";
import { renderBlockToDataURL } from "@/lib/editor/render-block-canvas";

const CoverCanvas = dynamic(() => import("./CoverCanvas"), {
  ssr: false,
  loading: () => (
    <div className="bg-muted animate-pulse rounded-lg w-full max-w-md aspect-[9/16] flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Carregando editor...</p>
    </div>
  ),
});

export interface EditorHandle {
  undo: () => void;
  redo: () => void;
  saveNow: () => void;
}

interface EditorClientProps {
  initialLayout: CoverLayout;
  baseImageUrl: string;
  onLayoutChange?: (layout: CoverLayout) => void;
  stageRef?: React.RefObject<Konva.Stage | null>;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  coverId: string;
  onSaveStatusChange?: (status: SaveStatus) => void;
}

const EditorClient = forwardRef<EditorHandle, EditorClientProps>(function EditorClient(
  { initialLayout, baseImageUrl, onLayoutChange, stageRef: externalStageRef, onHistoryChange, coverId, onSaveStatusChange },
  ref
) {
  const { current: layout, push: pushLayout, undo, redo, canUndo, canRedo } =
    useHistory<CoverLayout>(migrateLayout(initialLayout));

  const { status: saveStatus, saveNow } = useSaveLayout({
    coverId,
    layout,
    debounceMs: 2000,
  });

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [blockImages, setBlockImages] = useState<Record<string, string>>({});

  // Renderiza (ou re-renderiza) um bloco de texto para dataURL
  const renderBlock = useCallback(async (block: TextBlock) => {
    const dataURL = await renderBlockToDataURL(block, { pixelRatio: 2 });
    if (dataURL) {
      setBlockImages((prev) => ({ ...prev, [block.id]: dataURL }));
    }
  }, []);

  // Renderiza todos os blocos quando o layout carrega ou textBlocks mudam
  useEffect(() => {
    if (!layout) return;
    layout.textBlocks.forEach((block) => {
      renderBlock(block);
    });
  }, [layout.textBlocks, renderBlock]);

  // Notifica pai sobre estado do histórico
  useEffect(() => {
    onHistoryChange?.(canUndo, canRedo);
  }, [canUndo, canRedo, onHistoryChange]);

  // Notifica pai sobre estado do save
  useEffect(() => {
    onSaveStatusChange?.(saveStatus);
  }, [saveStatus, onSaveStatusChange]);

  // Expõe undo/redo/saveNow via ref
  useImperativeHandle(
    ref,
    () => ({ undo, redo, saveNow }),
    [undo, redo, saveNow]
  );

  const updateBlock = useCallback(
    async (blockId: string, updates: Partial<TextBlock>) => {
      const nextBlocks = layout.textBlocks.map((b) =>
        b.id === blockId ? { ...b, ...updates } : b
      );
      const next: CoverLayout = {
        ...layout,
        textBlocks: nextBlocks,
      };
      pushLayout(next);
      onLayoutChange?.(next);

      // Re-renderiza o bloco modificado
      const updatedBlock = nextBlocks.find((b) => b.id === blockId);
      if (updatedBlock) {
        await renderBlock(updatedBlock);
      }
    },
    [layout, pushLayout, onLayoutChange, renderBlock]
  );

  const selectedBlock = selectedBlockId && layout?.textBlocks
    ? layout.textBlocks.find((b) => b.id === selectedBlockId) ?? null
    : null;

  const toggleHidden = useCallback(
    (blockId: string) => {
      const next: CoverLayout = {
        ...layout,
        textBlocks: layout.textBlocks.map((b) =>
          b.id === blockId ? { ...b, hidden: !b.hidden } : b
        ),
      };
      pushLayout(next);
      onLayoutChange?.(next);
    },
    [layout, pushLayout, onLayoutChange]
  );

  const renameBlock = useCallback(
    (blockId: string, name: string) => {
      const next: CoverLayout = {
        ...layout,
        textBlocks: layout.textBlocks.map((b) =>
          b.id === blockId ? { ...b, name } : b
        ),
      };
      pushLayout(next);
      onLayoutChange?.(next);
    },
    [layout, pushLayout, onLayoutChange]
  );

  const reorderBlocks = useCallback(
    (orderedIds: string[]) => {
      const total = orderedIds.length;
      const next: CoverLayout = {
        ...layout,
        textBlocks: layout.textBlocks.map((b) => {
          const newZIndex = total - 1 - orderedIds.indexOf(b.id);
          return { ...b, zIndex: newZIndex };
        }),
      };
      pushLayout(next);
      onLayoutChange?.(next);
    },
    [layout, pushLayout, onLayoutChange]
  );

  const duplicateBlock = useCallback(
    (blockId: string) => {
      const original = layout.textBlocks.find((b) => b.id === blockId);
      if (!original) return;

      const newId = `block-${Date.now()}`;
      const duplicate: TextBlock = {
        ...original,
        id: newId,
        name: undefined,
        position: {
          x: original.position.x + 30,
          y: original.position.y + 30,
        },
        zIndex: layout.textBlocks.length,
      };

      const next: CoverLayout = {
        ...layout,
        textBlocks: [...layout.textBlocks, duplicate],
      };
      pushLayout(next);
      onLayoutChange?.(next);
      setSelectedBlockId(newId);
    },
    [layout, pushLayout, onLayoutChange]
  );

  const deleteBlock = useCallback(
    (blockId: string) => {
      if (layout.textBlocks.length <= 1) return;
      const next: CoverLayout = {
        ...layout,
        textBlocks: layout.textBlocks.filter((b) => b.id !== blockId),
      };
      pushLayout(next);
      onLayoutChange?.(next);
      setSelectedBlockId(null);
    },
    [layout, pushLayout, onLayoutChange]
  );

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      const tag = (e.target as HTMLElement).tagName;
      // Não captura quando usuário está digitando em input/textarea
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (isMeta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (isMeta && (e.key === "Z" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (isMeta && e.key === "d") {
        e.preventDefault();
        if (selectedBlockId) duplicateBlock(selectedBlockId);
      } else if (e.key === "Escape") {
        setSelectedBlockId(null);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedBlockId && layout.textBlocks.length > 1) {
          deleteBlock(selectedBlockId);
        }
      } else if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown"
      ) {
        if (!selectedBlockId) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const delta = {
          ArrowLeft: { x: -step, y: 0 },
          ArrowRight: { x: step, y: 0 },
          ArrowUp: { x: 0, y: -step },
          ArrowDown: { x: 0, y: step },
        }[e.key]!;
        const block = layout.textBlocks.find((b) => b.id === selectedBlockId);
        if (block) {
          updateBlock(selectedBlockId, {
            position: {
              x: block.position.x + delta.x,
              y: block.position.y + delta.y,
            },
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, selectedBlockId, layout, duplicateBlock, deleteBlock, updateBlock]);

  // Calcula displayWidth dinamicamente baseado no aspect ratio do layout
  const aspectRatio = layout.canvasSize.width / layout.canvasSize.height;
  const maxHeight = 640;
  const maxWidth = 480;
  let displayWidth = maxWidth;
  let displayHeight = displayWidth / aspectRatio;
  if (displayHeight > maxHeight) {
    displayHeight = maxHeight;
    displayWidth = displayHeight * aspectRatio;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      {/* Canvas */}
      <div className="flex-1 flex justify-center">
        <CoverCanvas
          layout={layout}
          baseImageUrl={baseImageUrl}
          displayWidth={displayWidth}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onUpdateBlock={updateBlock}
          blockImages={blockImages}
          stageRef={externalStageRef}
        />
      </div>

      {/* Sidebar: Layers + Tools */}
      <div className="w-full lg:w-[480px] flex-shrink-0 flex gap-2 lg:sticky lg:top-4 lg:self-start max-h-[calc(100vh-2rem)]">
        {/* Layers Panel */}
        <div className="w-36 flex-shrink-0 bg-card rounded-lg border border-border overflow-y-auto">
          <div className="p-2 border-b">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Camadas
            </span>
          </div>
          <LayersPanel
            blocks={layout.textBlocks}
            selectedBlockId={selectedBlockId}
            onSelect={setSelectedBlockId}
            onToggleHidden={toggleHidden}
            onRename={renameBlock}
            onReorder={reorderBlocks}
            onDuplicate={duplicateBlock}
            onDelete={deleteBlock}
          />
        </div>

        {/* Tools Panel */}
        <div className="flex-1 bg-card rounded-lg border border-border overflow-y-auto">
          <ToolsPanel
            selectedBlock={selectedBlock}
            onUpdate={(updates) => {
              if (selectedBlockId) updateBlock(selectedBlockId, updates);
            }}
          />
        </div>
      </div>
    </div>
  );
});

export default EditorClient;
