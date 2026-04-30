"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ItalicToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  fontFamily: string;
}

const FONTS_WITHOUT_ITALIC = ["Anton"];

export default function ItalicToggle({ value, onChange, fontFamily }: ItalicToggleProps) {
  const supportsItalic = !FONTS_WITHOUT_ITALIC.includes(fontFamily);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label htmlFor="italic-toggle" className="text-xs font-medium">
          Itálico
        </Label>
        <Switch
          id="italic-toggle"
          checked={value && supportsItalic}
          onCheckedChange={onChange}
          disabled={!supportsItalic}
        />
      </div>
      {!supportsItalic && (
        <p className="text-xs text-muted-foreground">
          Anton não tem versão italic
        </p>
      )}
    </div>
  );
}
