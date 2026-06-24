"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({
  theme: "light",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`;

/**
 * Inline script that sets the .dark class before first paint.
 * Must be a Client Component so typeof window check works on both
 * server (text/javascript → executes) and client (text/plain → React ignores).
 */
export function ThemeScript() {
  return (
    <script
      suppressHydrationWarning
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem(STORAGE_KEY) as Theme) ?? "light";
  });

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  // Sync on mount (covers client-side navigations where the inline script didn't re-run)
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme) ?? "light";
    setThemeState(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
