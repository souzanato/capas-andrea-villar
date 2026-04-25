import { db } from "@/lib/db";
import OpenAI from "openai";
import { loadMetaPrompt } from "./meta-prompt";
import { buildUserMessage, extractFinalPrompt } from "./openai";
import { generateImageFromPrompt } from "./gemini";
import { enter, exit, log, error as logError } from "./debug-logger";

export interface RefineInput {
  coverId: string;
  userMessage: string;
}

export interface RefineResult {
  newVersion: number;
  assistantMessage: string;
}

/**
 * Executa o pipeline de refino para uma capa já gerada:
 *   1. Busca cover + baseImage + generatedImages + messages
 *   2. Monta contexto pro GPT: meta-prompt + turnos iniciais simulados + histórico real + novo pedido
 *   3. GPT-4o retorna prompt atualizado
 *   4. Gemini gera nova imagem com o prompt atualizado + imagem base original
 *   5. Salva GeneratedImage (version = última + 1)
 *   6. Salva Message (role: ASSISTANT) confirmando
 */
export async function runRefinementPipeline(
  input: RefineInput
): Promise<RefineResult> {
  const fn = "runRefinementPipeline";
  await enter(fn, { coverId: input.coverId, userMessageLength: input.userMessage.length });

  const cover = await db.cover.findUnique({
    where: { id: input.coverId },
    include: {
      baseImage: true,
      generatedImages: {
        orderBy: { version: "desc" },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cover) { await logError(fn, "Cover not found"); throw new Error("Capa não encontrada."); }
  if (!cover.baseImage) { await logError(fn, "No base image"); throw new Error("Capa sem imagem base."); }

  const lastImage = cover.generatedImages[0];
  if (!lastImage) { await logError(fn, "No generated images"); throw new Error("Nenhuma imagem gerada ainda para refinar."); }

  await log(fn, "log", { coverStatus: cover.status, lastVersion: lastImage.version, messageCount: cover.messages.length });

  // ── 1. Prepara dados ──────────────────────────────

  const imageBase64 = Buffer.from(cover.baseImage.data).toString("base64");
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada.");

  const openai = new OpenAI({ apiKey });
  const metaPrompt = await loadMetaPrompt();

  // ── 2. Monta mensagens para o GPT ─────────────────

  const initialUserText = buildUserMessage({
    title: cover.title,
    format: cover.format as "REELS_9_16" | "FEED_1_1" | "CAROUSEL_4_5",
    contentType: cover.contentType,
    palette: cover.palette,
    accentColor: cover.accentColor,
    customPalette: cover.customPalette as string[] | null,
    imageBase64,
    imageMimeType: cover.baseImage.mimeType,
  });

  const gptMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: metaPrompt },
    {
      role: "user",
      content: [
        { type: "text", text: initialUserText },
        {
          type: "image_url",
          image_url: {
            url: `data:${cover.baseImage.mimeType};base64,${imageBase64}`,
          },
        },
      ],
    } as OpenAI.Chat.ChatCompletionMessageParam,
    {
      role: "assistant",
      content: `[Generated initial output]\n\n${lastImage.promptUsed}`,
    },
  ];

  // Injeta histórico real de mensagens (USER / ASSISTANT alternadas)
  for (const msg of cover.messages) {
    gptMessages.push({
      role: msg.role.toLowerCase() as "user" | "assistant",
      content: msg.content,
    });
  }

  // Novo pedido do usuário
  gptMessages.push({
    role: "user",
    content: `${input.userMessage}\n\nPor favor gere uma nova versão completa do prompt incorporando esse ajuste, mantendo todas as outras decisões. Devolva apenas o bloco markdown com o output completo (mesmo formato), incluindo a seção ## FINAL PROMPT — GEMINI / NANO BANANA.`,
  });

  // ── 3. Chama GPT-4o ───────────────────────────────

  await log(fn, "http_request", { model: "gpt-4o", temperature: 0.7, max_tokens: 2000, messages: gptMessages.length });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 2000,
    messages: gptMessages,
  });

  const gptContent = response.choices[0]?.message?.content;
  if (!gptContent) { await logError(fn, "Empty GPT response"); throw new Error("Resposta vazia do GPT-4o."); }

  await log(fn, "http_response", { contentLength: gptContent.length, finishReason: response.choices[0]?.finish_reason });

  const newPrompt = extractFinalPrompt(gptContent, cover.title);

  // ── 4. Chama Gemini ───────────────────────────────

  await log(fn, "log", { phase: "gemini", newPromptLength: newPrompt.length });

  const result = await generateImageFromPrompt({
    prompt: newPrompt,
    baseImageBase64: imageBase64,
    baseImageMimeType: cover.baseImage.mimeType,
    format: cover.format as "REELS_9_16" | "FEED_1_1" | "CAROUSEL_4_5",
  });

  // ── 5. Salva nova GeneratedImage ──────────────────

  const newVersion = lastImage.version + 1;

  await db.generatedImage.create({
    data: {
      coverId: input.coverId,
      data: result.data,
      mimeType: result.mimeType,
      width: result.width,
      height: result.height,
      sizeBytes: result.data.length,
      version: newVersion,
      promptUsed: newPrompt,
    },
  });

  const assistantMessage = `Gerei uma nova versão (v${newVersion}) com o ajuste solicitado.`;

  // ── 6. Salva mensagem de confirmação ──────────────

  await db.message.create({
    data: {
      coverId: input.coverId,
      role: "ASSISTANT",
      content: assistantMessage,
    },
  });

  await exit(fn, { newVersion, assistantMessage });

  return { newVersion, assistantMessage };
}
