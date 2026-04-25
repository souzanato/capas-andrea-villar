import { readFile } from "fs/promises";
import path from "path";

export const META_PROMPT_VERSION = "v17-api";

let cachedMetaPrompt: string | null = null;

export async function loadMetaPrompt(): Promise<string> {
  if (cachedMetaPrompt) return cachedMetaPrompt;

  const filePath = path.join(
    process.cwd(),
    "prompts",
    "meta-prompt-v17-api.md"
  );

  cachedMetaPrompt = await readFile(filePath, "utf-8");
  return cachedMetaPrompt;
}
