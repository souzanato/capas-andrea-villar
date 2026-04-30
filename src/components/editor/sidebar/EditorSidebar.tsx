"use client";

import type { TextBlock } from "@/lib/editor/layout-schema";
import LinesEditor from "./LinesEditor";
import FontSelect from "./FontSelect";
import SizeControl from "./SizeControl";
import WeightControl from "./WeightControl";
import ItalicToggle from "./ItalicToggle";
import GlowControl from "./GlowControl";
import ShadowControl from "./ShadowControl";
import LetterSpacingControl from "./LetterSpacingControl";
import LineHeightControl from "./LineHeightControl";
import BlockActions from "./BlockActions";

interface EditorSidebarProps {
  selectedBlock: TextBlock | null;
  onUpdate: (updates: Partial<TextBlock>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export default function EditorSidebar({
  selectedBlock,
  onUpdate,
  onDuplicate,
  onDelete,
  canDelete,
}: EditorSidebarProps) {
  if (!selectedBlock) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Clique em um texto no canvas para editar suas propriedades.
        </p>
      </div>
    );
  }

  // Helpers pra atualizar campos aninhados
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

  const { effects } = selectedBlock;

  return (
    <div className="space-y-5 p-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      {/* Header + Ações */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/70 truncate">
            {selectedBlock.name || selectedBlock.lines[0]?.text || "Bloco"}
          </h3>
        </div>
        <BlockActions
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          canDelete={canDelete}
        />
      </div>

      {/* Conteúdo */}
      <div className="space-y-4">
        <LinesEditor
          lines={selectedBlock.lines}
          onChange={(lines) => onUpdate({ lines })}
        />

        <hr className="border-border" />

        <FontSelect
          value={selectedBlock.typography.fontFamily}
          onChange={(fontFamily) => updateTypography({ fontFamily })}
        />

        <SizeControl
          value={selectedBlock.typography.fontSize}
          onChange={(fontSize) => updateTypography({ fontSize })}
        />

        <WeightControl
          value={selectedBlock.typography.fontWeight}
          onChange={(fontWeight) => updateTypography({ fontWeight })}
        />

        <ItalicToggle
          value={selectedBlock.typography.italic}
          onChange={(italic) => updateTypography({ italic })}
          fontFamily={selectedBlock.typography.fontFamily}
        />
      </div>

      {/* Efeitos */}
      <div className="space-y-4">
        <hr className="border-border" />
        <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
          Efeitos
        </h4>

        <GlowControl
          value={effects?.glow ?? null}
          defaultColor="#FFFFFF"
          onChange={(glow) => updateEffects({ glow })}
        />

        <ShadowControl
          value={effects?.shadow ?? null}
          onChange={(shadow) => updateEffects({ shadow })}
        />
      </div>

      {/* Avançado */}
      <div className="space-y-4">
        <hr className="border-border" />
        <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
          Avançado
        </h4>

        <LetterSpacingControl
          value={selectedBlock.typography.letterSpacing}
          onChange={(letterSpacing) => updateTypography({ letterSpacing })}
        />

        <LineHeightControl
          value={selectedBlock.typography.lineHeight}
          onChange={(lineHeight) => updateTypography({ lineHeight })}
        />
      </div>
    </div>
  );
}
