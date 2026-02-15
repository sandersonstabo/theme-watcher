export type Theme = "light" | "dark";

export type ThemePreference = Theme | "system";

export type ThemeSource = "prop" | "storage" | "default" | "system";

export type ThemeAttribute = "data-theme" | "class";

export interface ThemeState {
  theme: ThemePreference;
  resolvedTheme: Theme;
  source: ThemeSource;
}

export interface ThemeWatcherProps {
  theme?: Theme;
  storageKey?: string;
  attribute?: ThemeAttribute;
  defaultTheme?: ThemePreference;
}

export interface ThemeApi extends ThemeState {
  set: (theme: ThemePreference) => void;
  get: () => ThemePreference;
}
