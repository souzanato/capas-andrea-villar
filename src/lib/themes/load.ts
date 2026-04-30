import { readFile } from "fs/promises";
import path from "path";
import { ThemeSchema, type Theme } from "./types";

const cache = new Map<string, Theme>();

export async function loadTheme(themeId: string): Promise<Theme> {
  if (cache.has(themeId)) {
    return cache.get(themeId)!;
  }

  const themePath = path.join(process.cwd(), "themes", `${themeId}.json`);
  const content = await readFile(themePath, "utf-8");
  const parsed = JSON.parse(content);
  const theme = ThemeSchema.parse(parsed);

  cache.set(themeId, theme);
  return theme;
}
