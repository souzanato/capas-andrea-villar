"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import CoverHeader from "@/components/cover/CoverHeader";
import CoverImage from "@/components/cover/CoverImage";
import CoverToolbar from "@/components/cover/CoverToolbar";
import CoverInputsCard from "@/components/cover/CoverInputsCard";
import CoverPromptCard from "@/components/cover/CoverPromptCard";
import RefinementChat from "@/components/cover/RefinementChat";

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

interface CoverDetailMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface CoverDetailProps {
  cover: {
    id: string;
    title: string;
    format: string;
    contentType: string;
    palette: string;
    accentColor: string | null;
    status: string;
    createdAt: string;
    generatedPrompt: string | null;
    baseImage: CoverDetailBaseImage | null;
    generatedImages: CoverDetailGeneratedImage[];
    messages: CoverDetailMessage[];
  };
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

  // Track new versions (via badge) and auto-switch when a new one appears
  const prevCountRef = useRef(cover.generatedImages.length);

  useEffect(() => {
    const currentCount = cover.generatedImages.length;
    if (currentCount > prevCountRef.current) {
      // New version detected — auto-switch to latest
      setCurrentVersion(latestVersion);
    }
    prevCountRef.current = currentCount;
  }, [cover.generatedImages, latestVersion]);

  const imageUrl = `/api/covers/${cover.id}/image?version=${currentVersion}`;

  const isProcessing = cover.status !== "COMPLETED";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Left column — Image + Toolbar */}
      <div className="lg:col-span-3 space-y-6">
        <CoverHeader
          title={cover.title}
          status={cover.status}
          createdAt={cover.createdAt}
        />

        <CoverImage
          src={imageUrl}
          alt={cover.title}
          format={cover.format}
        />

        <CoverToolbar
          coverId={cover.id}
          coverTitle={cover.title}
          versions={versions}
          currentVersion={currentVersion}
          onVersionChange={setCurrentVersion}
          generatedPrompt={cover.generatedPrompt}
        />
      </div>

      {/* Right column — Inputs + Refino + Prompt */}
      <div className="lg:col-span-2 space-y-6">
        <CoverInputsCard
          title={cover.title}
          format={cover.format}
          contentType={cover.contentType}
          palette={cover.palette}
          accentColor={cover.accentColor}
          baseImage={cover.baseImage}
        />

        <RefinementChat
          coverId={cover.id}
          initialMessages={cover.messages}
          isProcessing={isProcessing}
        />

        {cover.generatedPrompt && (
          <CoverPromptCard prompt={cover.generatedPrompt} />
        )}
      </div>
    </div>
  );
}
