"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import EditorHeader from "@/components/cover/EditorHeader";
import EditorClient from "@/components/editor/EditorClient";
import type { EditorHandle } from "@/components/editor/EditorClient";
import CoverImage from "@/components/cover/CoverImage";
import CoverToolbar from "@/components/cover/CoverToolbar";
import type { CoverLayout } from "@/lib/editor/layout-schema";
import type { SaveStatus } from "@/hooks/useSaveLayout";
import type Konva from "konva";

interface CoverDetailGeneratedImage {
  version: number;
  width: number;
  height: number;
}

interface CoverDetailBaseImage {
  id: string;
  width: number;
  height: number;
  mimeType: string;
}

interface CoverDetailCover {
  id: string;
  title: string;
  format: string;
  contentType: string;
  palette: string;
  accentColor: string | null;
  status: string;
  createdAt: string;
  generatedPrompt: string | null;
  layoutJson: unknown;
  baseImage: CoverDetailBaseImage | null;
  generatedImages: CoverDetailGeneratedImage[];
}

interface CoverDetailProps {
  cover: CoverDetailCover;
}

export default function CoverDetail({ cover }: CoverDetailProps) {
  const versions = useMemo(() => {
    const seen = new Set<number>();
    return cover.generatedImages.filter((img) => {
      if (seen.has(img.version)) return false;
      seen.add(img.version);
      return true;
    });
  }, [cover.generatedImages]);

  const latestVersion = versions[0]?.version ?? 1;
  const [currentVersion, setCurrentVersion] = useState(latestVersion);
  const [currentLayout, setCurrentLayout] = useState<CoverLayout | null>(
    cover.layoutJson as CoverLayout | null
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const prevCountRef = useRef(cover.generatedImages.length);
  const stageRef = useRef<Konva.Stage>(null);
  const editorRef = useRef<EditorHandle>(null);

  const handleUndo = useCallback(() => {
    editorRef.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    editorRef.current?.redo();
  }, []);

  const handleSave = useCallback(() => {
    editorRef.current?.saveNow();
  }, []);

  useEffect(() => {
    const currentCount = cover.generatedImages.length;
    if (currentCount > prevCountRef.current) {
      setCurrentVersion(latestVersion);
    }
    prevCountRef.current = currentCount;
  }, [cover.generatedImages, latestVersion]);

  const imageUrl = `/api/covers/${cover.id}/image?version=${currentVersion}`;
  const isProcessing = cover.status !== "COMPLETED";

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-8rem)]">
      <EditorHeader
        title={cover.title}
        status={cover.status}
        createdAt={cover.createdAt}
        format={cover.format}
        accentColor={cover.accentColor}
        baseImage={cover.baseImage}
        layout={currentLayout}
        coverId={cover.id}
        saveStatus={saveStatus}
        onSave={handleSave}
      />

      <div className="flex-1">
        {cover.layoutJson ? (
          <EditorClient
            initialLayout={cover.layoutJson as CoverLayout}
            baseImageUrl={`/api/covers/${cover.id}/image?type=base`}
            onLayoutChange={setCurrentLayout}
            stageRef={stageRef}
            ref={editorRef}
            onHistoryChange={(cu, cr) => {
              setCanUndo(cu);
              setCanRedo(cr);
            }}
            coverId={cover.id}
            onSaveStatusChange={setSaveStatus}
          />
        ) : (
          <div className="max-w-md mx-auto">
            <CoverImage
              src={imageUrl}
              alt={cover.title}
              format={cover.format}
            />
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <CoverToolbar
          cover={{ id: cover.id, title: cover.title, generatedPrompt: cover.generatedPrompt }}
          versions={versions}
          currentVersion={currentVersion}
          onVersionChange={setCurrentVersion}
          isProcessing={isProcessing}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          stageRef={stageRef}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
