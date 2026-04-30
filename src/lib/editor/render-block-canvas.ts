import { TextBlock } from "@/lib/editor/layout-schema";

interface RenderOptions {
  pixelRatio?: number;
}

const hexToRgba = (color: string, alpha: number): string => {
  if (!color) return `rgba(255,255,255,${alpha})`;

  if (color.startsWith("rgba") || color.startsWith("rgb")) return color;

  let h = color.replace("#", "");

  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }

  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    return `rgba(255,255,255,${alpha})`;
  }

  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
};

export async function renderBlockToDataURL(
  block: TextBlock,
  options: RenderOptions = {}
): Promise<string | null> {
  const { pixelRatio = 2 } = options;

  // Aguarda fontes carregarem com carregamento explícito
  try {
    const { fontFamily, fontSize, fontWeight } = block.typography;
    const fontString = `${fontWeight} ${fontSize}px ${fontFamily}`;

    await Promise.race([
      Promise.all([
        document.fonts.load(fontString),
        document.fonts.load(`400 ${fontSize}px Anton`),
        document.fonts.load(`400 ${fontSize}px PlayfairDisplay`),
      ]),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch {
    // Continua mesmo sem fontes
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const {
    fontFamily,
    fontSize,
    fontWeight,
    italic,
    letterSpacing,
    lineHeight,
  } = block.typography;

  const fontStyle = italic ? "italic" : "normal";
  const fontString = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

  ctx.font = fontString;

  // Mede cada linha
  const lineTexts = block.lines.map((l) => l.text);
  const lineMetrics = lineTexts.map((text) => ctx.measureText(text));
  const maxWidth = Math.max(...lineMetrics.map((m) => m.width));
  const lineWidths = lineMetrics.map((m) => m.width);

  const lineHeightPx = fontSize * (lineHeight ?? 1.1);
  const totalHeight = lineHeightPx * block.lines.length;

  // Padding para glow/shadow nao cortarem
  const glowBlur = block.effects.glow?.enabled
    ? (block.effects.glow.blur ?? 0)
    : 0;
  const shadowPadding = block.effects.shadow?.enabled
    ? (block.effects.shadow.blur ?? 0) + Math.max(
        Math.abs(block.effects.shadow.offsetX ?? 0),
        Math.abs(block.effects.shadow.offsetY ?? 0)
      )
    : 0;
  const padding = Math.max(glowBlur * 3, shadowPadding * 2, 40) + 20;

  const canvasWidth = Math.ceil((maxWidth + padding * 2) * pixelRatio);
  const canvasHeight = Math.ceil((totalHeight + padding * 2) * pixelRatio);

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  ctx.scale(pixelRatio, pixelRatio);

  ctx.font = fontString;
  ctx.textBaseline = "top";

  const align = block.align ?? "left";
  const lsValue = letterSpacing ?? 0;

  // Renderiza linha com letterSpacing
  const drawTextLine = (text: string, x: number, y: number) => {
    if (lsValue === 0) {
      ctx.fillText(text, x, y);
      return;
    }
    let currentX = x;
    for (const char of text) {
      ctx.fillText(char, currentX, y);
      currentX += ctx.measureText(char).width + lsValue;
    }
  };

  // Renderiza stroke de linha com letterSpacing
  const strokeTextLine = (text: string, x: number, y: number) => {
    if (lsValue === 0) {
      ctx.strokeText(text, x, y);
      return;
    }
    let currentX = x;
    for (const char of text) {
      ctx.strokeText(char, currentX, y);
      currentX += ctx.measureText(char).width + lsValue;
    }
  };

  // Renderiza cada linha — 3 camadas
  block.lines.forEach((line, idx) => {
    const lineWidth = lineWidths[idx];

    let x = padding;
    if (align === "center") {
      x = padding + (maxWidth - lineWidth) / 2;
    } else if (align === "right") {
      x = padding + (maxWidth - lineWidth);
    }

    const y = padding + idx * lineHeightPx;

    const glowEnabled = block.effects.glow?.enabled ?? false;
    const isWhiteText = block.lines.every((l) => {
      const c = (l.color || "#FFFFFF").toLowerCase();
      return c === "#ffffff" || c === "#fff" || c === "white";
    });

    // === CAMADA 1: Glow externo denso via strokeText + múltiplos passes ===
    if (glowEnabled && block.effects.glow && !isWhiteText) {
      const passes = 3;
      for (let i = 0; i < passes; i++) {
        ctx.save();
        ctx.filter = `blur(${block.effects.glow.blur}px)`;
        ctx.globalAlpha = block.effects.glow.opacity;
        ctx.strokeStyle = block.effects.glow.color;
        ctx.lineWidth = Math.max(block.effects.glow.blur, 8);
        ctx.lineJoin = "round";
        ctx.miterLimit = 2;
        strokeTextLine(line.text, x, y);
        ctx.restore();
      }
    }

    // === CAMADA 2: Glow fill complementar (1 pass, blur menor, opacidade reduzida) ===
    if (glowEnabled && block.effects.glow) {
      ctx.save();
      ctx.filter = `blur(${Math.max(2, block.effects.glow.blur * 0.6)}px)`;
      ctx.globalAlpha = block.effects.glow.opacity * 0.65;
      ctx.fillStyle = block.effects.glow.color;
      drawTextLine(line.text, x, y);
      ctx.restore();
    }

    // === CAMADA 3: Shadow independente ===
    if (block.effects.shadow?.enabled && block.effects.shadow) {
      ctx.save();
      ctx.filter = "none";
      ctx.shadowColor = hexToRgba(block.effects.shadow.color, block.effects.shadow.opacity);
      ctx.shadowBlur = block.effects.shadow.blur;
      ctx.shadowOffsetX = block.effects.shadow.offsetX;
      ctx.shadowOffsetY = block.effects.shadow.offsetY;
      ctx.globalAlpha = 1;
      ctx.fillStyle = line.color;
      drawTextLine(line.text, x, y);
      ctx.restore();
    }

    // === CAMADA 4: Texto sólido por cima — SEMPRE ===
    ctx.save();
    ctx.filter = "none";
    ctx.globalAlpha = 1;
    ctx.fillStyle = line.color;
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    drawTextLine(line.text, x, y);
    ctx.restore();
  });

  return canvas.toDataURL("image/png");
}
