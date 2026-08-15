export type ThemeId =
  | "midnight-ink"
  | "espresso"
  | "arctic-blue"
  | "sage-meadow"
  | "lavender-mist"
  | "seafoam"
  | "slate-frost"
  | "rose-quartz";

export type ThemeMeta = {
  id: ThemeId;
  name: string;
  isDark: boolean;
  // Swatches for the picker UI: [page background, accent color].
  swatch: [string, string];
};

// Order here is the order shown in the picker.
export const THEMES: ThemeMeta[] = [
  { id: "midnight-ink", name: "Midnight Ink", isDark: true, swatch: ["#0b0e1a", "#7c9dfc"] },
  { id: "espresso", name: "Espresso", isDark: true, swatch: ["#1a1310", "#e0a458"] },
  { id: "arctic-blue", name: "Arctic Blue", isDark: false, swatch: ["#eef3fb", "#2563eb"] },
  { id: "sage-meadow", name: "Sage Meadow", isDark: false, swatch: ["#eef4ee", "#3f7d56"] },
  { id: "lavender-mist", name: "Lavender Mist", isDark: false, swatch: ["#f3f0fc", "#7256d6"] },
  { id: "seafoam", name: "Seafoam", isDark: false, swatch: ["#eaf9f6", "#0f9b8e"] },
  { id: "slate-frost", name: "Slate Frost", isDark: false, swatch: ["#eef1f5", "#46607d"] },
  { id: "rose-quartz", name: "Rose Quartz", isDark: false, swatch: ["#faeef2", "#b8577a"] },
];

export const DEFAULT_THEME: ThemeId = "arctic-blue";

export const THEME_IDS = THEMES.map((t) => t.id);

export function isThemeId(value: string | null): value is ThemeId {
  return !!value && THEME_IDS.includes(value as ThemeId);
}

export function themeById(id: ThemeId): ThemeMeta {
  return THEMES.find((t) => t.id === id)!;
}
