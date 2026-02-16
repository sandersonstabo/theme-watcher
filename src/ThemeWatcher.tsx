import { useEffect, useRef } from "react";
import { mount, configure } from "./store";
import type { ThemeWatcherProps } from "./types";

export function ThemeWatcher({
  theme,
  defaultTheme = "system",
  storageKey = "theme",
  attribute = "class",
  enableColorScheme = true,
  disableTransitionOnChange = false,
}: ThemeWatcherProps) {
  const firstMount = useRef(true);

  useEffect(() => {
    return mount({
      defaultTheme,
      storageKey,
      attribute,
      enableColorScheme,
      disableTransitionOnChange,
      forcedTheme: theme,
    });
  }, []);

  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }

    configure({
      defaultTheme,
      storageKey,
      attribute,
      enableColorScheme,
      disableTransitionOnChange,
      forcedTheme: theme,
    });
  }, [theme, defaultTheme, storageKey, attribute, enableColorScheme, disableTransitionOnChange]);

  return null;
}
