import { useSyncExternalStore } from "react";
import { subscribe, getSnapshot, setTheme, getTheme, toggleMode } from "./store";
import type { UseThemeReturn } from "./types";

const serverSnapshot = { theme: "system" as const, resolvedTheme: "light" as const, systemTheme: "light" as const };

export function useTheme(): UseThemeReturn {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);

  return {
    ...state,
    setTheme,
    set: setTheme,
    get: getTheme,
    toggleMode,
  };
}
