"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TextLine } from "@/lib/editor/layout-schema";

const QUICK_COLORS = [
  { hex: "#FFFFFF", label: "Branco" },
  { hex: "#1F4E8C", label: "Azul" },
  { hex: "#C8644D", label: "Vermelho" },
  { hex: "#2D7A6E", label: "Verde" },
  { hex: "#1F3247", label: "Navy" },
];

interface LinesEditorProps {
  lines: TextLine[];
  onChange: (lines: TextLine[]) => void;
}

export default function LinesEditor({ lines, onChange }: LinesEditorProps) {
  const updateLine = (idx: number, updates: Partial<TextLine>) => {
    const next = lines.map((line, i) => (i === idx ? { ...line, ...updates } : line));
    onChange(next);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) return; // mantem ao menos 1 linha
    const next = lines.filter((_, i) => i !== idx);
    onChange(next);
  };

  const addLine = () => {
    const next = [...lines, { text: "", color: "#FFFFFF" }];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Linhas</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 text-xs px-2"
          onClick={addLine}
        >
          + Adicionar linha
        </Button>
      </div>

      <div className="space-y-2">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className="flex items-start gap-1.5 p-2 rounded border border-border bg-background"
          >
            <div className="flex-1 min-w-0">
              <Input
                value={line.text}
                onChange={(e) => updateLine(idx, { text: e.target.value })}
                className="text-sm h-7"
                placeholder={`Linha ${idx + 1}`}
              />
            </div>

            <div className="flex items-center gap-0.5 flex-shrink-0">
              {QUICK_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => updateLine(idx, { color: c.hex })}
                  title={c.label}
                  className={`h-5 w-5 rounded-full border-2 transition-transform ${
                    line.color.toUpperCase() === c.hex.toUpperCase()
                      ? "border-foreground scale-110"
                      : "border-border hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <input
                type="color"
                value={line.color}
                onChange={(e) => updateLine(idx, { color: e.target.value.toUpperCase() })}
                className="h-5 w-5 rounded cursor-pointer border border-border ml-0.5"
              />
            </div>

            {lines.length > 1 && (
              <button
                type="button"
                onClick={() => removeLine(idx)}
                className="text-muted-foreground hover:text-foreground text-xs leading-none mt-1 flex-shrink-0"
                title="Remover linha"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
