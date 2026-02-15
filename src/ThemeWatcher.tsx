import { useEffect } from "react";
import { mountWatcher } from "./theme-store";
import type { ThemeWatcherProps } from "./types";

export function ThemeWatcher({
  theme,
  storageKey = "theme-watcher",
  attribute = "data-theme",
  defaultTheme = "system",
  variables,
  enableColorScheme = true
}: ThemeWatcherProps) {
  useEffect(() => {
    return mountWatcher({ storageKey, attribute, defaultTheme, variables, enableColorScheme }, theme);
  }, [theme, storageKey, attribute, defaultTheme, variables, enableColorScheme]);

  return null;
}
