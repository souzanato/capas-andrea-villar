import OpenAI from "openai";
import { loadMetaPrompt } from "./meta-prompt";
import { enter, exit, log, logSync, errorSync } from "./debug-logger";

// ── Tipos e constantes ──────────────────────────────

export interface PromptGenerationInput {
  title: string;
  format: "REELS_9_16" | "FEED_1_1" | "CAROUSEL_4_5";
  contentType: string;
  palette: string;
  accentColor: string | null;
  customPalette: string[] | null;
  imageBase64: string;
  imageMimeType: string;
}

/** Número de itens YES obrigatórios no Visual Quality Checklist. */
export const CHECKLIST_REQUIRED_YES_COUNT = 12;

// ── Helpers ────────────────────────────────────────

function getAccentColorName(accentHex: string | null, _palette: string): string {
  void _palette;
  if (!accentHex) return 'soft pastel pink';

  // Cores conhecidas da paleta (prioritário)
  const knownColors: Record<string, string> = {
    '#F0B4A5': 'soft rose pink',
    '#96B4D2': 'soft muted blue',
    '#96D2C3': 'soft mint green',
    '#FFE500': 'vibrant warm yellow',
    '#FFFFFF': 'pure white',
  };

  const upper = accentHex.toUpperCase();
  if (knownColors[upper]) return knownColors[upper];

  // Fallback inteligente: descreve QUALQUER hex em palavras visuais concretas
  return describeHexColor(accentHex);
}

function describeHexColor(hex: string): string {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return 'a soft custom color';

  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);

  // Brilho médio (0-255)
  const brightness = (r + g + b) / 3;

  // Modificador de brilho
  let brightnessModifier: string;
  if (brightness < 80) brightnessModifier = 'deep';
  else if (brightness < 130) brightnessModifier = 'rich';
  else if (brightness < 180) brightnessModifier = 'medium';
  else if (brightness < 220) brightnessModifier = 'soft';
  else brightnessModifier = 'pale';

  // Saturação (diferença entre max e min)
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max - min;

  // Se baixa saturação, é neutro
  if (saturation < 30) {
    if (brightness < 100) return 'deep charcoal gray';
    if (brightness < 200) return 'medium neutral gray';
    return 'soft light gray';
  }

  // Matiz dominante
  let hueName: string;
  if (r > g && r > b) {
    if (g > b * 1.5) hueName = (g > 150) ? 'orange' : 'rust';
    else if (b > g) hueName = 'pink';
    else hueName = 'red';
  } else if (g > r && g > b) {
    if (r > b) hueName = 'olive green';
    else if (b > r * 1.3) hueName = 'teal green';
    else hueName = 'green';
  } else if (b > r && b > g) {
    if (r > g) hueName = 'purple';
    else if (g > r * 1.3) hueName = 'blue';
    else hueName = (b - g > 60) ? 'navy blue' : 'blue';
  } else {
    hueName = 'neutral tone';
  }

  return `${brightnessModifier} ${hueName}`;
}

export function buildUserMessage(input: PromptGenerationInput): string {
  const formatLabel = {
    REELS_9_16: "9:16 (Reels/Stories, 1080×1920)",
    FEED_1_1: "1:1 (Feed quadrado, 1080×1080)",
    CAROUSEL_4_5: "4:5 (Carrossel, 1080×1350)",
  }[input.format];

  const accentName = getAccentColorName(input.accentColor, input.palette);

  return `# INPUTS (all confirmed by the user via UI wizard)

- Original title (verbatim): "${input.title}"
- Format: ${formatLabel}
- Content type: ${input.contentType}
- Palette: ${input.palette}
- Accent color name (USE THIS in layout instructions): ${accentName}
- Accent color hex (USE THIS only in PALETTE section at end): ${input.accentColor || 'N/A'}

# YOUR TASK

Execute ALL sections of the mandatory output format:

1. ## 🎯 Image Analysis
2. ## 🔢 Title Sequence (number every word: P1, P2, P3...)
3. ## ⚖️ Word Weights (0-10) (assign weight to EVERY word)
4. ## 📐 STEP A — Geometric Breakdown (CRITICAL: balance lines by character count FIRST, ignoring hierarchy)
5. ## 🎨 STEP B — Apply Hierarchy (within the geometric structure from STEP A)
6. ## 📋 Decisions
7. ## 🔍 Visual Quality Checklist (${CHECKLIST_REQUIRED_YES_COUNT} items, all must be YES)
8. ## 🎨 FINAL PROMPT — GEMINI / NANO BANANA

⚠️ CRITICAL: Do NOT decide line breakdown based on hierarchy preferences. The breakdown comes from CHARACTER COUNT balance.

⚠️ CRITICAL: PUNCHLINE SCALING — compute ratio = punchline_char_count / longest_setup_line_char_count. Apply the multiplier per RULE 3 based on this ratio. For short punchline words (4-5 chars) use 1.6-1.8×. For long punchline words (12+ chars) relative to a short setup, compute proportionally.

⚠️ CRITICAL — DESCRIBE COLOR BY NAME IN LAYOUT:
In the FINAL PROMPT layout instructions, describe the accent color using the NAME provided ("${accentName}").
NEVER write the hex code in layout instructions.
The hex code (${input.accentColor || ''}) appears ONLY in the PALETTE section at the END of the FINAL PROMPT.

⚠️ CRITICAL: NEVER describe the punchline effect as "shadow" or "drop shadow" or "directional shadow". The correct effect is BACKLIGHT GLOW — a radial halo of warm light behind the letters (in the same color as the punchline) combined with subtle darkening of the background near the letters. The word should feel ILLUMINATED FROM BEHIND, not floating in front of a shadow.

⚠️ CRITICAL — CHOOSE THE RIGHT LAYOUT TEMPLATE: Look at what L2 contains. If L2 is the punchline alone (no connectors), use Template B. If L2 has connectors + punchline, use Template A.

⚠️ Other rules:
- Use BACKLIGHT GLOW terminology, not shadow
- Never use ALL CAPS, never duplicate words

Begin.`;
}

// ── Extração do prompt final ───────────────────────

const FINAL_PROMPT_HEADING = "## 🎨 FINAL PROMPT — GEMINI / NANO BANANA";

function extractFinalPromptContent(gptResponse: string): string {
  const headingIndex = gptResponse.indexOf(FINAL_PROMPT_HEADING);

  if (headingIndex === -1) {
    throw new Error(
      `Seção "${FINAL_PROMPT_HEADING}" não encontrada na resposta do GPT.`
    );
  }

  let content = gptResponse.slice(headingIndex + FINAL_PROMPT_HEADING.length).trim();

  // Tenta extrair conteúdo de dentro de um bloco de código markdown
  const codeBlockMatch = content.match(/```(?:\w+)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    content = codeBlockMatch[1].trim();
  } else {
    // Se houver outro heading depois, corta nele
    const nextHeading = content.search(/\n## /);
    if (nextHeading !== -1) {
      content = content.slice(0, nextHeading).trim();
    }
  }

  return content;
}

/**
 * Extrai APENAS a seção FINAL PROMPT da resposta completa do GPT,
 * ignorando seções analíticas (STEP A, Word Weights, etc.).
 * Usa regex robusto para capturar o bloco correto.
 */
function extractOnlyFinalPromptSection(fullGptResponse: string): string {
  const fn = "extractOnlyFinalPromptSection";
  logSync(fn, "enter", { fullLength: fullGptResponse.length });

  // Procura pelo heading "FINAL PROMPT" (com ou sem emoji 🎨)
  // Captura tudo após o heading até o próximo ## ou fim do documento
  const finalPromptMatch = fullGptResponse.match(
    /##\s*🎨?\s*FINAL PROMPT[^\n]*\n([\s\S]+?)(?:\n```\s*$|\n##\s|$)/i
  );

  if (!finalPromptMatch) {
    // Fallback: tenta o extrator antigo
    try {
      const fallback = extractFinalPromptContent(fullGptResponse);
      logSync(fn, "exit", { method: "fallback", length: fallback.length });
      return fallback;
    } catch {
      const msg = `Could not extract FINAL PROMPT section from GPT response. Response may be malformed or truncated. Response length: ${fullGptResponse.length}`;
      errorSync(fn, msg);
      throw new Error(msg);
    }
  }

  // Remove fechamento ``` se houver
  let section = finalPromptMatch[1].trim();
  if (section.endsWith('```')) {
    section = section.substring(0, section.length - 3).trim();
  }

  logSync(fn, "exit", { method: "regex", length: section.length });
  return section;
}

// Extrai o FINAL PROMPT e valida o título (usado por refine.ts também)
export function extractFinalPrompt(gptResponse: string, originalTitle?: string): string {
  const content = extractFinalPromptContent(gptResponse);

  if (originalTitle) {
    validateExtractedPrompt(content, originalTitle);
  }

  return content;
}

function validateExtractedPrompt(extractedPrompt: string, originalTitle: string): void {
  const fn = "validateExtractedPrompt";
  logSync(fn, "enter", { title: originalTitle, promptLength: extractedPrompt.length });

  // Normaliza: lowercase + remove pontuação comum
  const normalize = (text: string): string =>
    text.toLowerCase()
      .replace(/[?!.,;:""''`]/g, '')  // remove pontuação
      .replace(/\s+/g, ' ')             // normaliza espaços
      .trim();

  const titleNormalized = normalize(originalTitle);
  const promptNormalized = normalize(extractedPrompt);

  // Pega palavras únicas do título (já sem pontuação)
  const titleWords = titleNormalized.split(/\s+/).filter(Boolean);
  const uniqueTitleWords = [...new Set(titleWords)];

  // Cada palavra única deve aparecer pelo menos uma vez no prompt normalizado
  for (const word of uniqueTitleWords) {
    // Usar boundary mais permissivo (\b nem sempre funciona com acentos)
    // Verificar se a palavra aparece como substring delimitada
    const wordRegex = new RegExp(`(^|\\s|"|')${word}(\\s|"|'|$)`, 'i');
    if (!wordRegex.test(promptNormalized)) {
      errorSync(fn, `Word "${word}" missing from extracted prompt`);
      throw new Error(
        `Title validation failed: word "${word}" (from title "${originalTitle}") ` +
        `missing from extracted prompt`
      );
    }
  }

  logSync(fn, "exit", { uniqueWords: uniqueTitleWords.length });
}

function validateChecklistPassed(gptResponse: string): void {
  const fn = "validateChecklistPassed";
  logSync(fn, "enter", { responseLength: gptResponse.length });

  const checklistMatch = gptResponse.match(
    /## 🔍 Visual Quality Checklist([\s\S]*?)## 🎨 FINAL PROMPT/
  );
  if (!checklistMatch) {
    errorSync(fn, "Missing checklist section");
    throw new Error("GPT response missing Visual Quality Checklist section");
  }

  const checklistContent = checklistMatch[1];
  const yesCount = (checklistContent.match(/:\s*YES/gi) || []).length;
  const noCount = (checklistContent.match(/:\s*NO/gi) || []).length;

  logSync(fn, "log", { yesCount, noCount });

  if (yesCount < CHECKLIST_REQUIRED_YES_COUNT) {
    errorSync(fn, `Only ${yesCount} YES (need ${CHECKLIST_REQUIRED_YES_COUNT})`);
    throw new Error(
      `Visual Quality Checklist incomplete: only ${yesCount} YES items found (need ${CHECKLIST_REQUIRED_YES_COUNT})`
    );
  }

  if (noCount > 0) {
    errorSync(fn, `${noCount} NO items found`);
    throw new Error(
      `Visual Quality Checklist has ${noCount} NO items — GPT should have redone the breakdown`
    );
  }

  logSync(fn, "exit", { yesCount });
}

function validateConnectorPlacement(finalPromptSection: string): void {
  const fn = "validateConnectorPlacement";
  logSync(fn, "enter", { sectionLength: finalPromptSection.length });

  const connectors = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'em', 'na', 'no',
                       'que', 'é', 'são', 'não', 'num', 'numa', 'pra', 'para', 'com', 'sem'];

  // Regex multilinha: linha que COMEÇA com "LINE N" no início
  // (flag /m faz ^ casar com início de cada linha)
  const lineRegex = /^LINE \d[^:\n]*:[^"]*"([^"]+)"/gm;
  const lines: { content: string; isAllConnectors: boolean }[] = [];
  let match: RegExpExecArray | null;

  while ((match = lineRegex.exec(finalPromptSection)) !== null) {
    const content = match[1].trim();
    const cleanContent = content.toLowerCase().replace(/[?!.,;:]/g, '');
    const words = cleanContent.split(/\s+/).filter(Boolean);
    const isAllConnectors = words.length > 0 && words.every(w => connectors.includes(w));
    lines.push({ content, isAllConnectors });
  }

  if (lines.length === 0) {
    logSync(fn, "exit", "No LINE N: lines found — skipping");
    return; // formato diferente, não bloqueia
  }

  const connectorOnlyLines = lines.filter(l => l.isAllConnectors);
  if (connectorOnlyLines.length === 0) {
    logSync(fn, "exit", { totalLines: lines.length, connectorLines: 0 });
    return;
  }

  logSync(fn, "log", { totalLines: lines.length, connectorOnlyLines: connectorOnlyLines.map(l => l.content) });

  if (connectorOnlyLines.length > 1) {
    errorSync(fn, `Multiple connector-only lines: ${connectorOnlyLines.map(l => l.content).join(", ")}`);
    throw new Error(
      `Multiple connector-only lines: ${connectorOnlyLines.map(l => `"${l.content}"`).join(', ')}.`
    );
  }

  const connectorLineIndex = lines.findIndex(l => l.isAllConnectors);

  // Linha 1 só de conectores É VÁLIDA se houver pelo menos uma linha depois
  if (connectorLineIndex === 0 && lines.length >= 2) {
    logSync(fn, "exit", { decision: "Line 1 connector-only — valid opening" });
    return; // OK — é abertura tipo "O que é" / "matrescência"
  }

  errorSync(fn, `Connector-only at position ${connectorLineIndex + 1} of ${lines.length}`);

  throw new Error(
    `Connector-only line "${connectorOnlyLines[0].content}" at position ${connectorLineIndex + 1} of ${lines.length}. ` +
    `Connectors should hug anchor words.`
  );
}

function validateGeometricBalance(extractedPrompt: string): void {
  const fn = "validateGeometricBalance";
  logSync(fn, "enter");

  const lineRegex = /LINE \d[^:]*:\s*(?:contains[^"]*)?"([^"]+)"/g;
  const lines: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = lineRegex.exec(extractedPrompt)) !== null) {
    lines.push(match[1].trim());
  }

  if (lines.length < 2) {
    logSync(fn, "exit", "Single line — skipping balance check");
    return;
  }

  // Conta caracteres (sem espaços) de cada linha
  const charCounts = lines.map((line) => line.replace(/\s+/g, "").length);

  const max = Math.max(...charCounts);
  const min = Math.min(...charCounts);

  // Se a diferença for maior que 75% do maior, está desbalanceado
  const diff = (max - min) / max;

  logSync(fn, "log", { lines, charCounts, diff: `${(diff * 100).toFixed(0)}%` });

  if (diff > 0.75) {
    errorSync(fn, `Balance failed: ${charCounts.join(", ")} chars, diff ${(diff * 100).toFixed(0)}%`);
    throw new Error(
      `Geometric balance failed: lines have very different lengths (${charCounts.join(", ")} chars). ` +
      `Diff: ${(diff * 100).toFixed(0)}%. Lines should be more similar in width.`
    );
  }

  logSync(fn, "exit", { diff: `${(diff * 100).toFixed(0)}%` });
}

function validateNoMetadataLeakage(finalPromptSection: string): void {
  const fn = "validateNoMetadataLeakage";
  logSync(fn, "enter");

  // Pega tudo ANTES da seção PALETTE (onde hex codes são permitidos)
  const paletteIndex = finalPromptSection.search(/PALETTE\s*:/i);
  const layoutSection =
    paletteIndex > 0
      ? finalPromptSection.substring(0, paletteIndex)
      : finalPromptSection;

  // Padrões problemáticos que vazam pra imagem
  const dangerousPatterns = [
    { pattern: /#[0-9A-Fa-f]{6}/g, name: "hex color codes" },
    { pattern: /\d+%\s*opacity/gi, name: "opacity percentages" },
    { pattern: /~?\d+°/g, name: "angle degrees" },
    { pattern: /\d+px\s*blur/gi, name: "pixel blur values" },
  ];

  const found: string[] = [];
  for (const { pattern, name } of dangerousPatterns) {
    const matches = layoutSection.match(pattern);
    if (matches && matches.length > 0) {
      found.push(`${name}: ${matches.slice(0, 3).join(", ")}`);
    }
  }

  if (found.length > 0) {
    errorSync(fn, `Leakage detected: ${found.join(" | ")}`);
    throw new Error(
      `Metadata leakage in layout: ${found.join(" | ")}. ` +
      `Use COLOR NAMES (e.g., "soft rose", "muted blue") in layout instructions. ` +
      `Hex codes belong ONLY in the PALETTE section at the end.`
    );
  }

  logSync(fn, "exit", "No leakage detected");
}

function validateNoShadowLanguage(finalPromptSection: string): void {
  const fn = "validateNoShadowLanguage";
  logSync(fn, "enter");

  // Helper: verifica se uma posição da string está dentro de um contexto negativo
  function isInNegativeContext(text: string, matchIndex: number): boolean {
    // Olha 30 caracteres antes do match
    const before = text.substring(Math.max(0, matchIndex - 30), matchIndex).toLowerCase();

    // Padrões de negação
    const negationPatterns = [
      /\bno\s+$/,
      /\bnot\s+$/,
      /\bnever\s+$/,
      /\bwithout\s+(?:any\s+|a\s+)?$/,
      /\bisn'?t\s+(?:a\s+)?$/,
      /\bdoesn'?t\s+(?:cast\s+|have\s+|use\s+|create\s+)?(?:a\s+|any\s+)?$/,
      /\bdo\s+not\s+(?:cast\s+|use\s+|have\s+)?(?:a\s+|any\s+)?$/,
      /\bavoid\s+(?:any\s+|a\s+)?$/,
    ];

    return negationPatterns.some(p => p.test(before));
  }

  // Termos potencialmente problemáticos (context-aware)
  const problematicTerms = [
    /\bdrop shadow\b/gi,
    /\bdirectional shadow\b/gi,
    /\bcast(?:s|ing)?\s+(?:a\s+)?shadow\b/gi,
  ];

  for (const pattern of problematicTerms) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(finalPromptSection)) !== null) {
      // Se está em contexto negativo, OK — ignora
      if (isInNegativeContext(finalPromptSection, match.index)) {
        logSync(fn, "log", { ignoredInNegativeContext: match[0] });
        continue;
      }

      errorSync(fn, `Positive context shadow: "${match[0]}"`);
      throw new Error(
        `Forbidden shadow language detected (positive context): "${match[0]}". ` +
        `Use BACKLIGHT GLOW terminology instead.`
      );
    }
  }

  // Padrões "shadow at angle" / "shadow projected" — sempre proibidos, mesmo negados
  // (porque o conceito em si contamina o raciocínio do Gemini)
  const alwaysForbiddenPatterns = [
    { pattern: /shadow.{0,30}at.{0,5}\d+\s*°/i, name: "shadow at angle (degrees)" },
    { pattern: /shadow.{0,20}projected.{0,30}(left|right|up|down)/i, name: "projected shadow direction" },
  ];

  for (const { pattern, name } of alwaysForbiddenPatterns) {
    const match = finalPromptSection.match(pattern);
    if (match) {
      errorSync(fn, `Always-forbidden: ${name} — "${match[0]}"`);
      throw new Error(`Forbidden shadow language: ${name} — "${match[0]}".`);
    }
  }

  // Validação positiva: deve mencionar backlight/glow/halo/illuminated
  const positivePatterns = [/\bbacklight\b/i, /\bglow\b/i, /\bhalo\b/i, /\billuminated\b/i];
  const hasIllumination = positivePatterns.some(p => p.test(finalPromptSection));

  if (!hasIllumination) {
    errorSync(fn, "Missing backlight/glow/halo/illuminated in prompt");
    throw new Error(
      `Missing backlight illumination description. ` +
      `The punchline must have a described glow/halo/backlight effect.`
    );
  }

  logSync(fn, "exit", { hasIllumination });
}

function validateFontStyleChoice(finalPromptSection: string): void {
  const fn = "validateFontStyleChoice";
  logSync(fn, "enter");

  // Helper: contexto negativo (janela de 80 chars, detecta "AVOID:", ❌, listas)
  function isInNegativeContext(text: string, matchIndex: number): boolean {
    // Olha 80 caracteres antes do match (mais largo que antes)
    const before = text.substring(Math.max(0, matchIndex - 80), matchIndex).toLowerCase();

    const negationPatterns = [
      // Padrões diretos
      /\bnot\s+(?:like\s+)?$/,
      /\bavoid\s+(?:like\s+)?$/,
      /\bnever\s+$/,
      /\bnot\s+\w+\s+like\s+$/,
      /\binstead\s+of\s+$/,
      /\brather\s+than\s+$/,

      // Padrões com pontuação (ex: "AVOID: Druk Wide")
      /\bavoid[:\s]+(?:these\s+\w+:?\s*)?$/,
      /\bavoid\s+\w+\s*:\s*$/,
      /\bnot\s+recommended[:\s]+$/,
      /\bnot\s+\w+\s+like\s*[:\s]+$/,
      /\bforbidden[:\s]+$/,
      /\bnever\s+use\s*[:\s]+$/,
      /\bdon'?t\s+use[:\s]+$/,

      // Padrões com emoji ❌
      /❌\s*$/,
      /❌[^\n]*$/,

      // "style to avoid" / "fonts to avoid" / "styles to avoid"
      /\b(?:style|styles|font|fonts|typography)\s+to\s+avoid[:\s]+$/,

      // "in the style of X, NOT Y" — padrão muito comum
      /,\s*not\s+$/,
      /,\s*never\s+$/,

      // Genérico: "avoid:" ou ❌ nos últimos 80 chars
      /\bavoid:[\s\S]*$/,
      /❌[\s\S]*$/,
    ];

    return negationPatterns.some(p => p.test(before));
  }

  // Fontes que queremos evitar (industrial/corporate/condensed-too-sharp)
  const forbiddenFonts = [
    /\bDruk\s+Wide\b/gi,
    /\bDruk\s+Heavy\b/gi,
    /\bIntegral\s+CF\b/gi,
    /\bKomu\s+A\b/gi,
    /\bHelvetica\s+(?:Neue\s+)?Black\b/gi,
    /\bArial\s+Black\b/gi,
    /\bObviously\s+Black\b/gi,
  ];

  for (const pattern of forbiddenFonts) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(finalPromptSection)) !== null) {
      if (isInNegativeContext(finalPromptSection, match.index)) {
        logSync(fn, "log", { ignoredInNegativeContext: match[0] });
        continue;
      }

      errorSync(fn, `Forbidden font: "${match[0]}"`);
      throw new Error(
        `Forbidden industrial font reference: "${match[0]}". ` +
        `Use warm editorial fonts instead (Sharp Grotesk Black, Avenir Black, Gotham Black, Proxima Nova Black).`
      );
    }
  }

  // Validação positiva: deve mencionar ao menos uma fonte recomendada OU características visuais corretas
  const positiveFontPatterns = [
    /\bSharp\s+Grotesk\b/i,
    /\bAvenir\s+(?:Black|Next\s+Heavy)\b/i,
    /\bGotham\s+Black\b/i,
    /\bProxima\s+Nova\s+Black\b/i,
    /\bBrandon\s+Grotesque\b/i,
    /slightly[- ]?expanded\s+width/i,
    /softly[- ]?rounded\s+(?:corners|edges)/i,
    /warm\s+(?:editorial\s+)?(?:geometric\s+)?(?:heavy\s+)?sans/i,
  ];

  const hasPositiveDescriptor = positiveFontPatterns.some(p => p.test(finalPromptSection));

  logSync(fn, "log", { hasPositiveDescriptor });

  if (!hasPositiveDescriptor) {
    errorSync(fn, "No warm font descriptor found in prompt");
    throw new Error(
      `Missing warm geometric font description. ` +
      `Mention at least one reference (Sharp Grotesk / Avenir / Gotham / Proxima Nova Black) ` +
      `OR describe visual characteristics (slightly expanded width, softly rounded corners, warm editorial feel).`
    );
  }

  logSync(fn, "exit", { hasPositiveDescriptor });
}

// Última resposta crua do GPT (para logging no retry)
let lastGptContent: string | null = null;

// ── Chamada única (sem retry) ──────────────────────

async function generatePromptFromInputsRaw(
  input: PromptGenerationInput,
  additionalInstruction: string = ""
): Promise<string> {
  const fn = "generatePromptFromInputsRaw";
  await enter(fn, { title: input.title, format: input.format, hasAdditionalInstruction: !!additionalInstruction });

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    await errorSync(fn, "OPENAI_API_KEY not configured");
    throw new Error("OPENAI_API_KEY não configurada.");
  }

  const openai = new OpenAI({ apiKey });
  const metaPrompt = await loadMetaPrompt();

  const userMessage = buildUserMessage(input);
  const finalUserMessage = additionalInstruction
    ? userMessage + additionalInstruction
    : userMessage;

  await log(fn, "http_request", { model: "gpt-4o", temperature: 0.4, max_tokens: 4000, messageLength: finalUserMessage.length });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.4,
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content: metaPrompt,
      },
      {
        role: "user",
        content: [
          { type: "text", text: finalUserMessage },
          {
            type: "image_url",
            image_url: {
              url: `data:${input.imageMimeType};base64,${input.imageBase64}`,
            },
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  await log(fn, "http_response", { status: "ok", contentLength: content?.length || 0, finishReason: response.choices[0]?.finish_reason });

  if (!content) {
    await errorSync(fn, "Empty GPT response");
    throw new Error("Resposta vazia do GPT-4o.");
  }

  lastGptContent = content;

  // ── Validações ──────────────────────────────────
  try {
    // 1. Visual Quality Checklist — roda na resposta COMPLETA (seção fica antes do FINAL PROMPT)
    validateChecklistPassed(content);

    // 2. Extrai APENAS a seção FINAL PROMPT (ignora seções analíticas)
    const finalPromptOnly = extractOnlyFinalPromptSection(content);

    // 3. Anti-duplicação do título (no FINAL PROMPT apenas)
    validateExtractedPrompt(finalPromptOnly, input.title);

    // 4. Connector placement (no FINAL PROMPT apenas)
    validateConnectorPlacement(finalPromptOnly);

    // 5. Geometric balance (no FINAL PROMPT apenas)
    validateGeometricBalance(finalPromptOnly);

    // 6. Anti-metadata-leakage (no FINAL PROMPT apenas)
    validateNoMetadataLeakage(finalPromptOnly);

    // 7. Anti-shadow — v17 substituiu drop shadow direcional por backlight glow
    validateNoShadowLanguage(finalPromptOnly);

    // 8. Anti-fontes-industriais — v17 usa warm editorial fonts (Sharp Grotesk, Avenir, Gotham)
    validateFontStyleChoice(finalPromptOnly);

    await exit(fn, { finalPromptLength: finalPromptOnly.length });
    return finalPromptOnly;
  } catch (err) {
    await errorSync(fn, "Validation chain failed", {
      error: err instanceof Error ? err.message : String(err),
      step: "validation",
    });
    throw err;
  }
}

// ── Função pública com retry ───────────────────────

const MAX_RETRIES = 2;

export async function generatePromptFromInputs(
  input: PromptGenerationInput
): Promise<string> {
  const fn = "generatePromptFromInputs";
  await enter(fn, { title: input.title, format: input.format });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await logSync(fn, "log", { attempt: attempt + 1, maxAttempts: MAX_RETRIES + 1, lastError: lastError?.message || null });
    try {
      const additionalInstruction =
        attempt > 0
          ? `\n\n⚠️ RETRY ATTEMPT ${attempt}: Previous attempt failed validation: "${lastError?.message}". Pay extra attention to: connector placement (must hug anchor words, never form isolated lines), color assignment (only punchline gets accent color, all other words are white), dynamic punchline scaling (short words get 1.6-1.8×), no metadata leakage (describe in plain English, no hex/percentages inline), and complete the Visual Quality Checklist with all ${CHECKLIST_REQUIRED_YES_COUNT} YES.`
          : "";

      const result = await generatePromptFromInputsRaw(input, additionalInstruction);
      await exit(fn, { attempt: attempt + 1, resultLength: result.length });
      return result;
    } catch (err) {
      lastError = err as Error;
      await errorSync(fn, lastError.message, { attempt: attempt + 1 });
      console.warn(
        `[GPT pipeline] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed: ${lastError.message}`
      );
      if (attempt === MAX_RETRIES) {
        console.error(`[GPT pipeline] All ${MAX_RETRIES + 1} attempts failed.`);
        console.error(`[GPT pipeline] Original title: "${input.title}"`);
        console.error(`[GPT pipeline] Last response length: ${lastGptContent?.length || 0}`);
        console.error(`[GPT pipeline] Last response (FULL):`);
        console.error('---START---');
        console.error(lastGptContent);
        console.error('---END---');
        await errorSync(fn, `All retries exhausted`, { lastError: lastError.message, lastGptLength: lastGptContent?.length || 0 });
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error("Unexpected error in GPT pipeline");
}

