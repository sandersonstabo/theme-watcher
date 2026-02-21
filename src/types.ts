export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

export interface ThemeWatcherProps {
  theme?: Theme;
  defaultTheme?: ThemePreference;
  storageKey?: string;
  attribute?: "class" | `data-${string}`;
  enableColorScheme?: boolean;
  disableTransitionOnChange?: boolean;
}

export interface UseThemeReturn {
  theme: ThemePreference;
  resolvedTheme: Theme;
  systemTheme: Theme;
  setTheme: (theme: ThemePreference) => void;
  set: (theme: ThemePreference) => void;
  get: () => ThemePreference;
  toggleMode: () => void;
}
