import { useEffect } from "react";
import { mountWatcher } from "./theme-store";
import type { ThemeWatcherProps } from "./types";

export function ThemeWatcher({
  theme,
  storageKey = "theme-watcher",
  attribute = "data-theme",
  defaultTheme = "system"
}: ThemeWatcherProps) {
  useEffect(() => {
    return mountWatcher({ storageKey, attribute, defaultTheme }, theme);
  }, [theme, storageKey, attribute, defaultTheme]);

  return null;
}
