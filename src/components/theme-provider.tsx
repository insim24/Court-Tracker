"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  DEFAULT_THEME,
  isThemeId,
  themeById,
  type ThemeId,
} from "@/lib/themes";

const STORAGE_KEY = "theme";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeId) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", themeById(theme).isDark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      getComputedStyle(root).getPropertyValue("--background").trim(),
    );
  }
}

// The <html> element's data-theme/class are set synchronously by the
// blocking inline script in the root layout (see layout.tsx) before this
// component ever mounts, so the initial state here just needs to match
// whatever that script already applied — it reads the same localStorage
// key. Re-deriving it (rather than always starting from DEFAULT_THEME)
// avoids a wasted extra style recalculation on mount.
function readInitialTheme(): ThemeId {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const attr = document.documentElement.dataset.theme;
  return isThemeId(attr ?? null) ? (attr as ThemeId) : DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(readInitialTheme);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private browsing, quota) — theme just
      // won't persist across sessions, which is a fine degradation.
    }
  }, []);

  // Keep the theme-color meta tag correct even for the very first paint's
  // theme (applyTheme normally runs from setTheme, which isn't called on
  // initial mount).
  useEffect(() => {
    applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
