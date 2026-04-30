import type { CoverLayout } from "./layout-schema";

const GLOW_DEFAULT = {
  enabled: true,
  color: "#FFFFFF",
  blur: 20,
  opacity: 0.9,
};

/**
 * Converte layouts no schema antigo (text + color em typography)
 * pro schema novo (lines).
 * Também limpa campos removidos (role) e adiciona defaults (hidden, width, align).
 */
export function migrateLayout(raw: Record<string, unknown>): CoverLayout {
  if (!raw || typeof raw !== "object") {
    return {
      themeId: "",
      canvasSize: { width: 1080, height: 1920 },
      textBlocks: [],
      rationale: "",
    } as unknown as CoverLayout;
  }

  const canvasSize = raw.canvasSize as
    | { width: number; height: number }
    | undefined;

  const textBlocks = (raw.textBlocks ?? []) as Array<Record<string, unknown>>;

  const defaultWidth = canvasSize?.width
    ? canvasSize.width * 0.8
    : 320;

  const blocks = textBlocks.map((block) => {
    // Remove campo role (removido do schema)
    const cleaned = { ...block };
    delete cleaned.role;

    // Garante hidden
    if (typeof cleaned.hidden !== "boolean") {
      cleaned.hidden = false;
    }

    // Garante width default
    if (typeof cleaned.width !== "number") {
      cleaned.width = defaultWidth;
    }

    // Garante align default
    if (typeof cleaned.align !== "string") {
      cleaned.align = "left";
    }

    // Garante glow default apenas quando estiver ausente
    // Não resetar glows existentes — respeitar o que o usuário já configurou
    const blockEffects = cleaned.effects as
      | { glow?: object | null }
      | undefined;
    if (!blockEffects?.glow) {
      cleaned.effects = {
        ...(blockEffects ?? {}),
        glow: { ...GLOW_DEFAULT },
      };
    }

    const blockTypo = (cleaned.typography ?? {}) as Record<string, unknown>;

    // Migração Manrope → Anton (para schema novo e antigo)
    if (blockTypo.fontFamily === "Manrope") {
      blockTypo.fontFamily = "Anton";
      blockTypo.fontWeight = 400;
    }

    // Se ja tem 'lines', e schema novo
    if (Array.isArray(cleaned.lines)) {
      return cleaned;
    }

    // Schema antigo: text na raiz + color em typography
    const oldText = String(cleaned.text ?? "");
    const oldColor = String(blockTypo.color ?? "#FFFFFF");

    // Cria typography sem color
    const newTypography = { ...blockTypo };
    delete newTypography.color;

    // Anton tem peso único (400)
    if (newTypography.fontFamily === "Anton") {
      newTypography.fontWeight = 400;
    }

    // Cria block sem text (movido pra lines)
    delete cleaned.text;

    return {
      ...cleaned,
      lines: [{ text: oldText, color: oldColor }],
      typography: newTypography,
    };
  });

  return {
    ...raw,
    textBlocks: blocks,
  } as unknown as CoverLayout;
}
