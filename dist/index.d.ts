type Theme = "light" | "dark";
type ThemePreference = Theme | "system";
type ThemeSource = "prop" | "storage" | "default" | "system";
type ThemeAttribute = "data-theme" | "class";
interface ThemeState {
    theme: ThemePreference;
    resolvedTheme: Theme;
    source: ThemeSource;
}
interface ThemeWatcherProps {
    theme?: Theme;
    storageKey?: string;
    attribute?: ThemeAttribute;
    defaultTheme?: ThemePreference;
}
interface ThemeApi extends ThemeState {
    set: (theme: ThemePreference) => void;
    get: () => ThemePreference;
}

declare function ThemeWatcher({ theme, storageKey, attribute, defaultTheme }: ThemeWatcherProps): null;

declare function useTheme(): ThemeApi;

export { type Theme, type ThemeApi, type ThemeAttribute, type ThemePreference, type ThemeSource, type ThemeState, ThemeWatcher, type ThemeWatcherProps, useTheme };
