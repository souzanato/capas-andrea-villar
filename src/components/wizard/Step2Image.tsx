"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateImage } from "@/lib/validators/cover";

interface Step2ImageProps {
  imageFile: File | null;
  imagePreview: string | null;
  onImageChange: (file: File | null, preview: string | null) => void;
}

export default function Step2Image({
  imageFile,
  imagePreview,
  onImageChange,
}: Step2ImageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const err = validateImage(file);
      if (err) {
        setError(err);
        return;
      }
      const preview = URL.createObjectURL(file);
      onImageChange(file, preview);
    },
    [onImageChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    onImageChange(null, null);
  }, [imagePreview, onImageChange]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Imagem base</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Envie a imagem que servirá de fundo para a capa. Aceitamos JPEG, PNG
          ou WebP até 10MB.
        </p>
      </div>

      {imagePreview ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Preview"
            className="max-h-[300px] rounded-lg border object-contain"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            {imageFile?.name} ({(imageFile!.size / 1024 / 1024).toFixed(1)}MB)
          </p>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">
              Arraste a imagem aqui ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground">
              JPEG, PNG ou WebP — máximo 10MB
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
