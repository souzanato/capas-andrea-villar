"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AVAILABLE_FONTS = [
  { value: "Anton", label: "Anton (display)" },
  { value: "PlayfairDisplay", label: "Playfair Display (serif italic)" },
];

interface FontSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function FontSelect({ value, onChange }: FontSelectProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Fonte</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_FONTS.map((font) => (
            <SelectItem
              key={font.value}
              value={font.value}
              style={{ fontFamily: font.value }}
            >
              {font.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
