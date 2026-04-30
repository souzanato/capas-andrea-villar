"use client";

import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { CoverLayout, TextBlock } from "@/lib/editor/layout-schema";

interface CoverCanvasProps {
  layout: CoverLayout;
  baseImageUrl: string;
  displayWidth?: number;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (id: string, updates: Partial<TextBlock>) => void;
  blockImages: Record<string, string>;
  stageRef?: React.RefObject<Konva.Stage | null>;
}

export default function CoverCanvas({
  layout,
  baseImageUrl,
  displayWidth = 400,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  blockImages,
  stageRef: externalStageRef,
}: CoverCanvasProps) {
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const localStageRef = useRef<Konva.Stage>(null);
  const stageRef = externalStageRef ?? localStageRef;

  const { width: nativeW, height: nativeH } = layout.canvasSize;
  const scale = displayWidth / nativeW;
  const displayHeight = nativeH * scale;

  // Carrega imagem base
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = baseImageUrl;
    img.onload = () => setBaseImage(img);
    img.onerror = () => console.error("Failed to load base image");
  }, [baseImageUrl]);

  // ESC desseleciona
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelectBlock(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onSelectBlock]);

  // Click no fundo do stage desseleciona
  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      onSelectBlock(null);
    }
  };

  if (!baseImage) {
    return (
      <div
        className="bg-muted animate-pulse rounded-lg flex items-center justify-center"
        style={{ width: displayWidth, height: displayHeight }}
      >
        <p className="text-sm text-muted-foreground">Carregando canvas...</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-black">
      <Stage
        ref={stageRef as React.RefObject<Konva.Stage>}
        width={displayWidth}
        height={displayHeight}
        scaleX={scale}
        scaleY={scale}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        {/* Layer 1: foto base — não interativa */}
        <Layer listening={false}>
          <KonvaImage
            image={baseImage}
            x={0}
            y={0}
            width={nativeW}
            height={nativeH}
          />
        </Layer>

        {/* Layer 2: blocos de texto renderizados como imagem */}
        <Layer>
          {[...layout.textBlocks]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((block) => (
              <EditableImageBlock
                key={block.id}
                block={block}
                dataURL={blockImages[block.id] ?? ""}
                isSelected={block.id === selectedBlockId}
                onSelect={() => onSelectBlock(block.id)}
                onUpdate={(updates) => onUpdateBlock(block.id, updates)}
              />
            ))}
        </Layer>
      </Stage>
    </div>
  );
}

interface EditableImageBlockProps {
  block: TextBlock;
  dataURL: string;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextBlock>) => void;
}

function EditableImageBlock({
  block,
  dataURL,
  isSelected,
  onSelect,
  onUpdate,
}: EditableImageBlockProps) {
  const [image] = useImage(dataURL, "anonymous");
  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  if (block.hidden) return null;
  if (!image) return null;

  // A imagem foi renderizada com pixelRatio=2, mostrar em 50% do tamanho
  const displayWidth = image.width / 2;
  const displayHeight = image.height / 2;

  return (
    <>
      <KonvaImage
        ref={imageRef}
        image={image}
        x={block.position.x}
        y={block.position.y}
        width={displayWidth}
        height={displayHeight}
        rotation={block.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = "move";
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = "default";
        }}
        onDragEnd={(e) => {
          onUpdate({
            position: { x: e.target.x(), y: e.target.y() },
          });
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          onUpdate({
            position: { x: node.x(), y: node.y() },
            rotation: node.rotation(),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 30) return oldBox;
            return newBox;
          }}
          rotateEnabled
          borderStroke="#1F4E8C"
          borderStrokeWidth={2}
          anchorStroke="#1F4E8C"
          anchorFill="#FFFFFF"
          anchorSize={12}
          rotateAnchorOffset={30}
        />
      )}
    </>
  );
}
