"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { TextBlock } from "@/lib/editor/layout-schema";
import LinesEditor from "./sidebar/LinesEditor";
import FontSelect from "./sidebar/FontSelect";
import SizeControl from "./sidebar/SizeControl";
import WeightControl from "./sidebar/WeightControl";
import ItalicToggle from "./sidebar/ItalicToggle";
import AlignControl from "./sidebar/AlignControl";
import GlowControl from "./sidebar/GlowControl";
import ShadowControl from "./sidebar/ShadowControl";
import LetterSpacingControl from "./sidebar/LetterSpacingControl";
import LineHeightControl from "./sidebar/LineHeightControl";

interface ToolsPanelProps {
  selectedBlock: TextBlock | null;
  onUpdate: (updates: Partial<TextBlock>) => void;
}

export default function ToolsPanel({ selectedBlock, onUpdate }: ToolsPanelProps) {
  if (!selectedBlock) {
    return (
      <div className="flex flex-col items-center justify-center h-40 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Selecione uma camada para editar.
        </p>
      </div>
    );
  }

  const updateTypography = (changes: Partial<TextBlock["typography"]>) => {
    onUpdate({
      typography: { ...selectedBlock.typography, ...changes },
    });
  };

  const updateEffects = (changes: Partial<TextBlock["effects"]>) => {
    onUpdate({
      effects: { ...selectedBlock.effects, ...changes },
    });
  };

  const typography = selectedBlock.typography;
  const effects = selectedBlock.effects;

  return (
    <Tabs defaultValue="linhas" className="p-3">
      <TabsList className="w-full grid grid-cols-4">
        <TabsTrigger value="linhas" className="text-[11px] px-1">
          Linhas
        </TabsTrigger>
        <TabsTrigger value="fonte" className="text-[11px] px-1">
          Fonte
        </TabsTrigger>
        <TabsTrigger value="efeitos" className="text-[11px] px-1">
          Efeitos
        </TabsTrigger>
        <TabsTrigger value="avancado" className="text-[11px] px-1">
          Avançado
        </TabsTrigger>
      </TabsList>

      <TabsContent value="linhas" className="space-y-4 mt-3">
        <LinesEditor
          lines={selectedBlock.lines}
          onChange={(lines) => onUpdate({ lines })}
        />
      </TabsContent>

      <TabsContent value="fonte" className="space-y-4 mt-3">
        <FontSelect
          value={typography.fontFamily}
          onChange={(fontFamily) => updateTypography({ fontFamily })}
        />
        <SizeControl
          value={typography.fontSize}
          onChange={(fontSize) => updateTypography({ fontSize })}
        />
        <WeightControl
          value={typography.fontWeight}
          onChange={(fontWeight) => updateTypography({ fontWeight })}
          fontFamily={typography.fontFamily}
        />
        <ItalicToggle
          value={typography.italic}
          onChange={(italic) => updateTypography({ italic })}
          fontFamily={typography.fontFamily}
        />
        <AlignControl
          value={selectedBlock.align ?? "left"}
          onChange={(align) => onUpdate({ align })}
        />
      </TabsContent>

      <TabsContent value="efeitos" className="space-y-4 mt-3">
        <GlowControl
          value={effects?.glow ?? null}
          onChange={(glow) => updateEffects({ glow })}
        />
        <ShadowControl
          value={effects?.shadow ?? null}
          onChange={(shadow) => updateEffects({ shadow })}
        />
      </TabsContent>

      <TabsContent value="avancado" className="space-y-4 mt-3">
        <LetterSpacingControl
          value={typography.letterSpacing}
          onChange={(letterSpacing) => updateTypography({ letterSpacing })}
        />
        <LineHeightControl
          value={typography.lineHeight}
          onChange={(lineHeight) => updateTypography({ lineHeight })}
        />
      </TabsContent>
    </Tabs>
  );
}
